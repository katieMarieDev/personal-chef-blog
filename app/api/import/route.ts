import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth0 } from "@/lib/auth0";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
// ============================================================
// Mise — Import API Route
// POST /api/import
//
// Accepts: url, text, source, fileBase64 + fileMediaType (any combination)
// Flow:
//   1. Check auth (Auth0 session required)
//   2. Build Claude message from whatever input was provided
//   3. Call Claude to extract structured recipe JSON
//   4. If URL provided, fetch og:image for hero photo
//   5. Save recipe + ingredients + tags to Supabase
//   6. If user uploaded a photo, upload to Supabase Storage
//   7. Return { recipeId } to client
//
// Import modes:
//   url only       → fetch og:image, Claude parses URL content
//   text only      → Claude parses pasted text
//   file (PDF/img) → Claude reads as base64 document/image
//   url + text     → URL for attribution, text for content (paywalled sites)
// ============================================================

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const RECIPE_PROMPT = `Extract the recipe from the provided content and return ONLY a JSON object with these fields:
- title (string)
- source (string, domain or publication name)
- cook_time (string like "30 min")
- prep_time (string like "15 min")
- servings (number)
- meal_type (one of: breakfast, lunch, dinner, dessert, snack)
- ingredients (array of {qty: string, unit: string, name: string})
- steps (array of strings)
- tags (array of 2-4 strings from: weeknight, quick, vegetarian, vegan, comfort food, italian, salad, side, breakfast, pasta, roasted, soup, baking, meal prep, seafood, chicken, beef)

IMPORTANT:
- List every ingredient exactly as written, including uncommon, optional, or ambiguous ones. Do NOT substitute, omit, or normalize any ingredient.
- If an ingredient is written as “X or Y”, include it as-is.
- Do not change ingredient names to more common ones.
- If you are unsure, copy the ingredient text exactly.
- If URL page text is provided, prioritize the ingredient and instruction block in the main article content and ignore navigation, related posts, product grids, and footers.
- If multiple ingredient lists appear, choose the one nearest the recipe title and immediately followed by the recipe method/instructions.
- Return only valid JSON, no markdown, no explanation.`;

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&frac14;/gi, "1/4")
    .replace(/&frac12;/gi, "1/2")
    .replace(/&frac34;/gi, "3/4");
}

function htmlToText(html: string): string {
  const withLineBreaks = html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*p\s*>/gi, "\n")
    .replace(/<\s*\/\s*div\s*>/gi, "\n")
    .replace(/<\s*\/\s*h[1-6]\s*>/gi, "\n")
    .replace(/<\s*\/\s*li\s*>/gi, "\n")
    .replace(/<\s*li\b[^>]*>/gi, "- ");

  const withoutTags = withLineBreaks
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<[^>]+>/g, " ");

  return decodeHtmlEntities(withoutTags)
    .replace(/\r/g, "")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

// Walk a parsed JSON-LD object/array to find the first node with @type "Recipe"
// and a recipeIngredient list.
function findJsonLdRecipeNode(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findJsonLdRecipeNode(item);
      if (found) return found;
    }
    return null;
  }
  const obj = node as Record<string, unknown>;
  const rawType = obj["@type"];
  const types: string[] = Array.isArray(rawType)
    ? (rawType as string[])
    : typeof rawType === "string"
    ? [rawType]
    : [];
  if (types.includes("Recipe") && Array.isArray(obj["recipeIngredient"])) {
    return obj;
  }
  // Recurse into @graph and any array-valued keys
  for (const val of Object.values(obj)) {
    if (val && typeof val === "object") {
      const found = findJsonLdRecipeNode(val);
      if (found) return found;
    }
  }
  return null;
}

// Format a JSON-LD Recipe node as human-readable text for Claude.
function formatJsonLdRecipe(recipe: Record<string, unknown>): string {
  const lines: string[] = [];
  if (recipe.name) lines.push(`Title: ${recipe.name}`);
  if (recipe.description) lines.push(`Description: ${recipe.description}`);
  if (recipe.prepTime) lines.push(`Prep time: ${recipe.prepTime}`);
  if (recipe.cookTime) lines.push(`Cook time: ${recipe.cookTime}`);
  if (recipe.totalTime) lines.push(`Total time: ${recipe.totalTime}`);
  const yld = recipe.recipeYield;
  if (yld) lines.push(`Yield: ${Array.isArray(yld) ? yld[0] : yld}`);
  const cat = recipe.recipeCategory;
  if (cat)
    lines.push(`Category: ${Array.isArray(cat) ? cat.join(", ") : cat}`);

  const ingredients = recipe.recipeIngredient as string[];
  if (ingredients?.length) {
    lines.push("\nIngredients:");
    for (const ing of ingredients) lines.push(`- ${ing}`);
  }

  const rawSteps = recipe.recipeInstructions;
  if (rawSteps) {
    lines.push("\nInstructions:");
    const steps = Array.isArray(rawSteps) ? rawSteps : [rawSteps];
    steps.forEach((step, i) => {
      if (typeof step === "string") {
        lines.push(`${i + 1}. ${step}`);
      } else if (step && typeof step === "object") {
        const s = step as Record<string, unknown>;
        lines.push(`${i + 1}. ${s.text ?? s.name ?? JSON.stringify(step)}`);
      }
    });
  }

  return lines.join("\n");
}

// Fetch a URL and return page text.
// Strategy:
//   1. Prefer JSON-LD structured Recipe data (most accurate — used by NYT, Rancho Gordo, etc.)
//   2. Fall back to main article/content HTML with multiple selector attempts
// Returns null if the fetch fails or no usable content is found.
async function extractMainPageText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) {
      console.warn(`URL fetch failed: ${res.status} ${url}`);
      return null;
    }

    const html = await res.text();

    // ── Strategy 1: JSON-LD structured Recipe data ─────────────────────────
    const ldScripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    for (const m of ldScripts) {
      try {
        const node = findJsonLdRecipeNode(JSON.parse(m[1].trim()));
        if (node) {
          console.log(`JSON-LD Recipe found for ${url}`);
          return formatJsonLdRecipe(node);
        }
      } catch {
        // malformed JSON — try next block
      }
    }

    // ── Strategy 2: HTML content extraction ────────────────────────────────
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = titleMatch ? htmlToText(titleMatch[1]) : "";

    // Try progressively broader selectors
    const contentHtml =
      html.match(/<article[^>]*class=["'][^"']*article--single[^"']*["'][^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
      html.match(/<div[^>]*class=["'][^"']*recipe[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] ||
      html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ||
      html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
      null;

    if (!contentHtml) {
      console.warn(`No content container found for ${url}`);
      return null;
    }

    const text = htmlToText(contentHtml);
    if (!text) return null;

    const combined = [title, text].filter(Boolean).join("\n\n");
    return combined.slice(0, 14000);
  } catch (e) {
    console.error(`extractMainPageText error for ${url}:`, e);
    return null;
  }
}

// Fetch the og:image meta tag from a URL — used as the recipe hero photo.
// Most recipe sites (NYT, Smitten Kitchen, Substack, etc.) include this.
async function extractOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Mise/1.0)" },
    });
    const html = await res.text();
    const match =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Upload a user-provided photo to Supabase Storage.
// Returns the public URL, or null if upload fails.
// Photos are stored as: recipe-photos/{recipeId}/hero.{ext}
// The bucket is public — see ARCHITECTURE.md for why.
async function uploadPhotoToStorage(
  supabase: SupabaseClient,
  base64: string,
  mediaType: string,
  recipeId: string
): Promise<string | null> {
  try {
    const buffer = Buffer.from(base64, "base64");
    const ext = mediaType.split("/")[1] || "jpg";
    const filename = `${recipeId}/hero.${ext}`;

    const { error } = await supabase.storage
      .from("recipe-photos")
      .upload(filename, buffer, {
        contentType: mediaType,
        upsert: true,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("recipe-photos")
      .getPublicUrl(filename);

    return data.publicUrl;
  } catch (e) {
    console.error("Photo upload error:", e);
    return null;
  }
}

export async function POST(request: NextRequest) {
  // Check auth
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.sub;

  // Get request body
  const body = await request.json();
  const { url, text, source, notes, fileBase64, fileMediaType, overwriteRecipeId } = body;

  if (!url && !text && !fileBase64) {
    return NextResponse.json(
      { error: "Must provide url, text, or file" },
      { status: 400 }
    );
  }

  try {
    // Build Claude message content based on input type
    let userContent: Anthropic.MessageParam["content"];

    if (fileBase64 && fileMediaType) {
      // PDF or image — send as base64 block
      const isPdf = fileMediaType === "application/pdf";
      userContent = [
        isPdf
          ? {
              type: "document" as const,
              source: {
                type: "base64" as const,
                media_type: fileMediaType,
                data: fileBase64,
              },
            }
          : {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: fileMediaType,
                data: fileBase64,
              },
            },
        {
          type: "text" as const,
          text: RECIPE_PROMPT + (url ? `\n\nSource URL: ${url}` : ""),
        },
      ];
    } else {
      // Text or URL — send as plain text prompt
      const extractedPageText = url ? await extractMainPageText(url) : null;

      // If URL was provided but we couldn't fetch any content, and no fallback
      // text was supplied, abort — Claude would hallucinate from the URL alone.
      if (url && !text && !extractedPageText) {
        return NextResponse.json(
          { error: "Can't access the recipe from this website.", code: "URL_FETCH_FAILED" },
          { status: 422 }
        );
      }

      userContent =
        RECIPE_PROMPT +
        (url ? `\n\nURL: ${url}` : "") +
        (extractedPageText
          ? `\n\nExtracted page text (main content):\n${extractedPageText}`
          : "") +
        (text ? `\n\nUser-provided content:\n${text}` : "");
    }

    // Call Claude to extract recipe structure
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: userContent }],
    });

    const raw =
      response.content[0].type === "text" ? response.content[0].text : "{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

    // Extract hero image from og:image meta tag if URL was provided
    let heroImageUrl: string | null = null;
    if (url) {
      heroImageUrl = await extractOgImage(url);
    }

    // Save to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    let existingRecipe: { id: string; source: string; hero_image_url: string | null } | null = null;
    if (overwriteRecipeId) {
      const { data } = await supabase
        .from("recipes")
        .select("id, source, hero_image_url")
        .eq("id", overwriteRecipeId)
        .eq("user_id", userId)
        .single();

      if (!data) {
        return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
      }
      existingRecipe = data;
    }

    // Determine import mode for tracking
    const importedVia = fileBase64
      ? fileMediaType?.includes("pdf")
        ? "pdf"
        : "image"
      : url && text
      ? "both"
      : url
      ? "url"
      : "text";

    // Defensive: abort if Claude extraction failed or returned no ingredients/steps
    if (!parsed.ingredients || parsed.ingredients.length === 0 || !parsed.steps || parsed.steps.length === 0) {
      return NextResponse.json({ error: "Recipe extraction failed or returned no ingredients/steps. No changes made." }, { status: 422 });
    }

    // Insert recipe or overwrite an existing one.
    // source priority: user-provided > Claude-extracted > existing value > hostname > fallback
    const nextSource =
      source ||
      parsed.source ||
      existingRecipe?.source ||
      (url ? new URL(url).hostname.replace("www.", "") : "Manual entry");

    const baseRecipePayload = {
      title: parsed.title || "Untitled Recipe",
      source: nextSource,
      source_url: url || null,
      cook_time: parsed.cook_time || null,
      prep_time: parsed.prep_time || null,
      servings: parsed.servings || null,
      meal_type: parsed.meal_type || "dinner",
      steps: parsed.steps || [],
      hero_image_url: heroImageUrl ?? existingRecipe?.hero_image_url ?? null,
      imported_via: importedVia,
      notes: notes || null,
    };

    const recipeQuery = overwriteRecipeId
      ? supabase
          .from("recipes")
          .update(baseRecipePayload)
          .eq("id", overwriteRecipeId)
          .eq("user_id", userId)
          .select()
          .single()
      : supabase
          .from("recipes")
          .insert({
            user_id: userId,
            ...baseRecipePayload,
          })
          .select()
          .single();

    const { data: recipe, error: recipeError } = await recipeQuery;

    if (recipeError) throw recipeError;

    // Upload user-provided photo to Supabase Storage if present.
    // Only for image files — PDFs are used for text extraction only.
    // Updates both recipe_photos table and hero_image_url on the recipe row.
    if (fileBase64 && fileMediaType && !fileMediaType.includes("pdf")) {
      const photoUrl = await uploadPhotoToStorage(
        supabase,
        fileBase64,
        fileMediaType,
        recipe.id
      );
      if (photoUrl) {
        await supabase.from("recipe_photos").insert({
          recipe_id: recipe.id,
          url: photoUrl,
          is_hero: true,
        });
        await supabase
          .from("recipes")
          .update({ hero_image_url: photoUrl })
          .eq("id", recipe.id);
      }
    }

    if (overwriteRecipeId) {
      await supabase.from("ingredients").delete().eq("recipe_id", recipe.id);
      await supabase.from("recipe_tags").delete().eq("recipe_id", recipe.id);
    }

    // Insert ingredients (one row per ingredient for structured search)
    if (parsed.ingredients?.length > 0) {
      await supabase.from("ingredients").insert(
        parsed.ingredients.map(
          (ing: { qty: string; unit: string; name: string }) => ({
            recipe_id: recipe.id,
            qty: ing.qty,
            unit: ing.unit,
            name: ing.name,
          })
        )
      );
    }

    // Insert tags (normalize to lowercase to avoid case duplicates)
    if (parsed.tags?.length > 0) {
      await supabase.from("recipe_tags").insert(
        parsed.tags.map((tag: string) => ({
          recipe_id: recipe.id,
          tag: tag.toLowerCase().trim(),
        }))
      );
    }

    return NextResponse.json({ success: true, recipeId: recipe.id });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import recipe" },
      { status: 500 }
    );
  }
}
