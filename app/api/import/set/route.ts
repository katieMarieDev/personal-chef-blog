import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth0 } from "@/lib/auth0";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export const maxDuration = 60;

const RECIPE_PROMPT = `Extract a recipe from the provided content and return ONLY a JSON object with these fields:
- title (string)
- source (string or null)
- cook_time (string like "30 min" or null)
- prep_time (string like "15 min" or null)
- servings (number or null)
- meal_type (one of: breakfast, lunch, dinner, dessert, snack)
- ingredients (array of {qty: string, unit: string, name: string})
- steps (array of strings)
- tags (array of 2-4 strings from: weeknight, quick, vegetarian, vegan, comfort food, italian, salad, side, breakfast, pasta, roasted, soup, baking, meal prep, seafood, chicken, beef)
Return only valid JSON, no markdown, no explanation.`;

const PDF_PROMPT = `This is a "3 for 3" meal planning document: 3 anchor/base ingredients → 3 complete meals.

Extract the following and return ONLY valid JSON, no markdown, no explanation:
{
  "setName": "a short descriptive name for this meal set",
  "anchorIngredients": ["core ingredient 1", "core ingredient 2", "core ingredient 3"],
  "recipes": [
    {
      "title": "string",
      "source": "newsletter or author name if mentioned",
      "cook_time": "string like '30 min'",
      "prep_time": "string like '15 min'",
      "servings": 1,
      "meal_type": "breakfast|lunch|dinner|dessert|snack",
      "ingredients": [{"qty": "string", "unit": "string", "name": "string"}],
      "steps": ["string"],
      "tags": ["choose 2-4 from: weeknight, quick, vegetarian, vegan, comfort food, italian, salad, side, breakfast, pasta, roasted, soup, baking, meal prep, seafood, chicken, beef"]
    }
  ]
}

For anchorIngredients, use the simple core ingredient name — e.g. "tofu" not "Crispy Crumbled Tofu", "mushrooms" not "Roasted Mushrooms". These are used for search.
Extract the 3 full meal recipes (not the simple component prep recipes).`;

type RecipeRow = {
  title: string;
  source?: string | null;
  cook_time?: string | null;
  prep_time?: string | null;
  servings?: number | null;
  meal_type?: string;
  steps?: string[];
  ingredients?: { qty: string; unit: string; name: string }[];
  tags?: string[];
};

async function insertRecipesAndSet(
  supabase: SupabaseClient,
  userId: string,
  recipes: RecipeRow[],
  setName: string,
  anchorIngredients: string[],
  importedVia: string
): Promise<string> {
  const recipeIds: string[] = [];

  for (const recipe of recipes) {
    const { data: inserted, error } = await supabase
      .from("recipes")
      .insert({
        user_id: userId,
        title: recipe.title,
        source: recipe.source || "3 for 3",
        cook_time: recipe.cook_time || null,
        prep_time: recipe.prep_time || null,
        servings: recipe.servings || null,
        meal_type: recipe.meal_type || "dinner",
        steps: recipe.steps || [],
        imported_via: importedVia,
      } as any)
      .select()
      .single();

    if (error || !inserted) continue;
    recipeIds.push(inserted.id);

    if (recipe.ingredients?.length) {
      await supabase.from("ingredients").insert(
        recipe.ingredients.map((ing) => ({
          recipe_id: inserted.id,
          qty: ing.qty,
          unit: ing.unit,
          name: ing.name,
        })) as any
      );
    }
    if (recipe.tags?.length) {
      await supabase.from("recipe_tags").insert(
        recipe.tags.map((tag: string) => ({
          recipe_id: inserted.id,
          tag: tag.toLowerCase().trim(),
        })) as any
      );
    }
  }

  const { data: set, error: setError } = await supabase
    .from("sets")
    .insert({
      user_id: userId,
      name: setName,
      anchor_ingredients: anchorIngredients,
      grocery_list: null,
    } as any)
    .select()
    .single();

  if (setError || !set) throw setError;

  if (recipeIds.length > 0) {
    await supabase
      .from("set_recipes")
      .insert(recipeIds.map((recipe_id) => ({ set_id: set.id, recipe_id })) as any);
  }

  return set.id;
}

export async function POST(request: NextRequest) {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
  const userId = session.user.sub;

  try {
    // ── Form path: structured 3-for-3 entry ──────────────────────────────────
    if (body.recipes && !body.fileBase64) {
      const { source, planName, anchorIngredients, recipes } = body as {
        source: string | null;
        planName: string;
        anchorIngredients: string[];
        recipes: { title: string; content: string }[];
      };

      // Parse all 3 recipes in parallel
      const parsed = await Promise.all(
        recipes.map(async (r) => {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1500,
            messages: [{
              role: "user",
              content: `${RECIPE_PROMPT}\n\nTitle: ${r.title}${source ? `\nSource: ${source}` : ""}\n\nContent:\n${r.content}`,
            }],
          });
          const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
          const data = JSON.parse(raw.replace(/```json|```/g, "").trim());
          return {
            ...data,
            title: r.title,
            source: source || data.source || "3 for 3",
          };
        })
      );

      const setId = await insertRecipesAndSet(
        supabase, userId, parsed, planName, anchorIngredients, "3for3-form"
      );
      return NextResponse.json({ setId });
    }

    // ── PDF path (legacy) ────────────────────────────────────────────────────
    const { fileBase64, fileMediaType } = body;
    if (!fileBase64 || fileMediaType !== "application/pdf") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: fileBase64 },
          },
          { type: "text", text: PDF_PROMPT },
        ],
      }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

    const setId = await insertRecipesAndSet(
      supabase,
      userId,
      parsed.recipes ?? [],
      parsed.setName || "Imported 3 for 3",
      parsed.anchorIngredients || [],
      "pdf"
    );
    return NextResponse.json({ setId });

  } catch (error) {
    console.error("Set import error:", error);
    return NextResponse.json({ error: "Failed to import set" }, { status: 500 });
  }
}
