import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin";
import { auth0 } from "@/lib/auth0";
import { getRecipeById } from "@/lib/content";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

type PatchBody = {
	title?: string;
	prepTime?: string;
	cookTime?: string;
	servings?: string | number;
	notes?: string;
	tags?: string[];
	steps?: string[];
	ingredients?: Array<{ qty?: string; unit?: string; name?: string }>;
	isPublic?: boolean;
};

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const session = await auth0.getSession();
	const recipe = await getRecipeById(id, isAdmin(session));

	if (!recipe) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	return NextResponse.json({ ok: true, recipe });
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const session = await auth0.getSession();
	if (!isAdmin(session)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = (await request.json()) as PatchBody;
	const supabase = getSupabaseAdminClient();

	const servingsNumber =
		typeof body.servings === "number"
			? body.servings
			: body.servings
			? Number.parseInt(body.servings, 10)
			: null;

	const { error } = await supabase
		.from("recipes")
		.update({
			title: body.title,
			prep_time: body.prepTime,
			cook_time: body.cookTime,
			servings: Number.isFinite(servingsNumber as number) ? servingsNumber : null,
			notes: body.notes ?? null,
			steps: body.steps ?? [],
			is_public: typeof body.isPublic === "boolean" ? body.isPublic : undefined,
		})
		.eq("id", id);

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	if (Array.isArray(body.tags)) {
		await supabase.from("recipe_tags").delete().eq("recipe_id", id);
		const normalizedTags = body.tags
			.map((tag) => tag.toLowerCase().trim())
			.filter(Boolean);
		if (normalizedTags.length > 0) {
			const tagRows: Array<{ recipe_id: string; tag: string }> = normalizedTags.map((tag) => ({
				recipe_id: id,
				tag,
			}));
			await supabase
				.from("recipe_tags")
				.insert(tagRows);
		}
	}

	if (Array.isArray(body.ingredients)) {
		await supabase.from("ingredients").delete().eq("recipe_id", id);
		const cleanedIngredients = body.ingredients
			.map((ingredient) => ({
				qty: (ingredient.qty ?? "").trim(),
				unit: (ingredient.unit ?? "").trim(),
				name: (ingredient.name ?? "").trim(),
			}))
			.filter((ingredient) => ingredient.name.length > 0);

		if (cleanedIngredients.length > 0) {
			const ingredientRows: Array<{
				recipe_id: string;
				qty: string;
				unit: string;
				name: string;
			}> = cleanedIngredients.map((ingredient) => ({
				recipe_id: id,
				...ingredient,
			}));
			await supabase
				.from("ingredients")
				.insert(ingredientRows);
		}
	}

	return NextResponse.json({ success: true });
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const session = await auth0.getSession();
	if (!isAdmin(session)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const supabase = getSupabaseAdminClient();

	const { data: recipeRow, error: readError } = await supabase
		.from("recipes")
		.select("id, is_public")
		.eq("id", id)
		.maybeSingle();

	if (readError) {
		return NextResponse.json({ error: readError.message }, { status: 500 });
	}

	if (!recipeRow) {
		return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
	}

	if (recipeRow.is_public) {
		return NextResponse.json(
			{ error: "Unpublish this recipe before deleting it." },
			{ status: 409 },
		);
	}

	// Delete child rows first (no cascade set up in schema)
	await supabase.from("ingredients").delete().eq("recipe_id", id);
	await supabase.from("recipe_tags").delete().eq("recipe_id", id);
	await supabase.from("recipe_photos").delete().eq("recipe_id", id);

	const { error } = await supabase.from("recipes").delete().eq("id", id);
	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ success: true });
}