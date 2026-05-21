import type { BlogPost, Ingredient, Recipe } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const PLACEHOLDER_RECIPE_IMAGE =
	"https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80";

type BlogRow = {
	id: string;
	title: string;
	slug: string;
	body: string | null;
	excerpt: string | null;
	hero_image_url: string | null;
	published_at: string | null;
	created_at: string | null;
};

type RecipeRow = {
	id: string;
	title: string;
	source: string | null;
	source_url: string | null;
	cook_time: string | null;
	prep_time: string | null;
	servings: number | null;
	meal_type: string | null;
	steps: string[] | null;
	notes: string | null;
	is_public: boolean | null;
	hero_image_url: string | null;
	created_at: string | null;
};

type IngredientRow = {
	recipe_id: string;
	qty: string | null;
	unit: string | null;
	name: string;
};

type TagRow = {
	recipe_id: string;
	tag: string;
};

function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
}

function excerptFromBody(body: string, maxLength = 160): string {
	const text = body.replace(/\s+/g, " ").trim();
	if (!text) {
		return "";
	}
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength).trimEnd()}...`;
}

function toRecipeMealType(value: string | null): Recipe["mealType"] {
	if (
		value === "breakfast" ||
		value === "lunch" ||
		value === "dinner" ||
		value === "dessert" ||
		value === "snack"
	) {
		return value;
	}
	return "dinner";
}

function mapBlogPost(row: BlogRow): BlogPost {
	return {
		id: row.id,
		slug: row.slug,
		title: row.title,
		excerpt: row.excerpt ?? excerptFromBody(row.body ?? ""),
		body: row.body ?? "",
		heroImageUrl: row.hero_image_url ?? undefined,
		publishedAt: row.published_at,
		isPublished: !!row.published_at,
	};
}

function mapRecipe(
	row: RecipeRow,
	ingredients: Ingredient[],
	tags: string[],
): Recipe {
	const fallbackExcerpt = row.notes || row.steps?.[0] || "Imported recipe";

	return {
		id: row.id,
		title: row.title,
		source: row.source || row.source_url || "Unknown source",
		heroImageUrl: row.hero_image_url || PLACEHOLDER_RECIPE_IMAGE,
		excerpt: fallbackExcerpt,
		prepTime: row.prep_time || "TBD",
		cookTime: row.cook_time || "TBD",
		servings: row.servings || 4,
		mealType: toRecipeMealType(row.meal_type),
		tags,
		ingredients,
		steps: row.steps || [],
		notes: row.notes || undefined,
		isPublic: !!row.is_public,
	};
}

export async function ensureUniqueBlogSlug(
	title: string,
	excludeSlug?: string,
): Promise<string> {
	const supabase = getSupabaseServerClient();
	const base = slugify(title) || "post";
	let slug = base;
	let counter = 2;

	while (true) {
		const { data, error } = await supabase
			.from("blog_posts")
			.select("slug")
			.eq("slug", slug)
			.maybeSingle();

		if (error) {
			throw error;
		}

		if (!data || (excludeSlug && data.slug === excludeSlug)) {
			return slug;
		}

		slug = `${base}-${counter}`;
		counter += 1;
	}
}

export async function getBlogPosts(options?: {
	includeUnpublished?: boolean;
}): Promise<BlogPost[]> {
	const supabase = getSupabaseServerClient();
	let query = supabase
		.from("blog_posts")
		.select("id, title, slug, body, excerpt, hero_image_url, published_at, created_at")
		.order("created_at", { ascending: false });

	if (!options?.includeUnpublished) {
		query = query.not("published_at", "is", null);
	}

	const { data, error } = await query;
	if (error) {
		throw error;
	}

	return (data as BlogRow[]).map(mapBlogPost);
}

export async function getBlogPostBySlug(
	slug: string,
	options?: { includeUnpublished?: boolean },
): Promise<BlogPost | undefined> {
	const supabase = getSupabaseServerClient();
	let query = supabase
		.from("blog_posts")
		.select("id, title, slug, body, excerpt, hero_image_url, published_at, created_at")
		.eq("slug", slug);

	if (!options?.includeUnpublished) {
		query = query.not("published_at", "is", null);
	}

	const { data, error } = await query.maybeSingle();
	if (error) {
		throw error;
	}

	if (!data) {
		return undefined;
	}

	return mapBlogPost(data as BlogRow);
}

export async function getFeaturedPost(): Promise<BlogPost | undefined> {
	const posts = await getBlogPosts({ includeUnpublished: false });
	return posts[0];
}

export async function getRecipes(includePrivate: boolean): Promise<Recipe[]> {
	const supabase = getSupabaseServerClient();
	let recipeQuery = supabase
		.from("recipes")
		.select(
			"id, title, source, source_url, cook_time, prep_time, servings, meal_type, steps, notes, is_public, hero_image_url, created_at",
		)
		.order("created_at", { ascending: false });

	if (!includePrivate) {
		recipeQuery = recipeQuery.eq("is_public", true);
	}

	const { data: recipeRows, error: recipeError } = await recipeQuery;
	if (recipeError) {
		throw recipeError;
	}

	const rows = (recipeRows || []) as RecipeRow[];
	if (rows.length === 0) {
		return [];
	}

	const recipeIds = rows.map((row) => row.id);
	const [{ data: ingredientRows, error: ingredientError }, { data: tagRows, error: tagError }] =
		await Promise.all([
			supabase
				.from("ingredients")
				.select("recipe_id, qty, unit, name")
				.in("recipe_id", recipeIds),
			supabase
				.from("recipe_tags")
				.select("recipe_id, tag")
				.in("recipe_id", recipeIds),
		]);

	if (ingredientError) {
		throw ingredientError;
	}
	if (tagError) {
		throw tagError;
	}

	const ingredientsByRecipe = new Map<string, Ingredient[]>();
	for (const ingredient of (ingredientRows || []) as IngredientRow[]) {
		const current = ingredientsByRecipe.get(ingredient.recipe_id) || [];
		current.push({
			qty: ingredient.qty || "",
			unit: ingredient.unit || undefined,
			name: ingredient.name,
		});
		ingredientsByRecipe.set(ingredient.recipe_id, current);
	}

	const tagsByRecipe = new Map<string, string[]>();
	for (const tag of (tagRows || []) as TagRow[]) {
		const current = tagsByRecipe.get(tag.recipe_id) || [];
		current.push(tag.tag);
		tagsByRecipe.set(tag.recipe_id, current);
	}

	return rows.map((row) =>
		mapRecipe(
			row,
			ingredientsByRecipe.get(row.id) || [],
			tagsByRecipe.get(row.id) || [],
		),
	);
}

export async function getRecipeById(
	id: string,
	includePrivate: boolean,
): Promise<Recipe | undefined> {
	const supabase = getSupabaseServerClient();
	let recipeQuery = supabase
		.from("recipes")
		.select(
			"id, title, source, source_url, cook_time, prep_time, servings, meal_type, steps, notes, is_public, hero_image_url, created_at",
		)
		.eq("id", id);

	if (!includePrivate) {
		recipeQuery = recipeQuery.eq("is_public", true);
	}

	const { data: recipeRow, error: recipeError } = await recipeQuery.maybeSingle();
	if (recipeError) {
		throw recipeError;
	}

	if (!recipeRow) {
		return undefined;
	}

	const [{ data: ingredientRows, error: ingredientError }, { data: tagRows, error: tagError }] =
		await Promise.all([
			supabase
				.from("ingredients")
				.select("recipe_id, qty, unit, name")
				.eq("recipe_id", id),
			supabase
				.from("recipe_tags")
				.select("recipe_id, tag")
				.eq("recipe_id", id),
		]);

	if (ingredientError) {
		throw ingredientError;
	}
	if (tagError) {
		throw tagError;
	}

	return mapRecipe(
		recipeRow as RecipeRow,
		((ingredientRows || []) as IngredientRow[]).map((ingredient) => ({
			qty: ingredient.qty || "",
			unit: ingredient.unit || undefined,
			name: ingredient.name,
		})),
		((tagRows || []) as TagRow[]).map((tag) => tag.tag),
	);
}

export async function getFeaturedRecipes(): Promise<Recipe[]> {
	const recipes = await getRecipes(false);
	return recipes.slice(0, 2);
}
