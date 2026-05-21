import { blogPosts as initialBlogPosts, recipes as initialRecipes } from "@/lib/mock-data";
import type { BlogPost, Recipe } from "@/lib/types";

const PLACEHOLDER_RECIPE_IMAGE =
	"https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80";

function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
}

function extractExcerpt(text: string, maxLength = 160): string {
	const cleaned = text.replace(/\s+/g, " ").trim();
	if (cleaned.length <= maxLength) {
		return cleaned;
	}

	return `${cleaned.slice(0, maxLength).trimEnd()}...`;
}

function extractTitleFromText(text: string): string {
	const lines = text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	for (const line of lines) {
		if (line.startsWith("#")) {
			return line.replace(/^#+\s*/, "").trim();
		}
	}

	return lines[0] ?? "Imported Recipe";
}

function extractStepsFromText(text: string): string[] {
	const lines = text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.filter((line) => !line.startsWith("#"));

	if (lines.length === 0) {
		return ["Review and update this imported recipe before publishing."];
	}

	return lines.slice(0, 10);
}

function uniqueSlug(title: string, existingPosts: BlogPost[]): string {
	const base = slugify(title) || "post";
	let slug = base;
	let counter = 2;

	while (existingPosts.some((post) => post.slug === slug)) {
		slug = `${base}-${counter}`;
		counter += 1;
	}

	return slug;
}

type ContentStore = {
	recipes: Recipe[];
	blogPosts: BlogPost[];
};

declare global {
	var __chefContentStore: ContentStore | undefined;
}

const store =
	globalThis.__chefContentStore ??
	{
		recipes: structuredClone(initialRecipes),
		blogPosts: structuredClone(initialBlogPosts),
	};

globalThis.__chefContentStore = store;

export function getRecipes(includePrivate: boolean): Recipe[] {
	if (includePrivate) {
		return store.recipes;
	}

	return store.recipes.filter((recipe) => recipe.isPublic);
}

export function getRecipeById(id: string): Recipe | undefined {
	return store.recipes.find((recipe) => recipe.id === id);
}

export function addImportedRecipe(input: {
	url?: string;
	text?: string;
	imageDataUrl?: string;
}): Recipe {
	const sourceText = input.text?.trim() ?? "";
	const sourceUrl = input.url?.trim() ?? "";
	const title = sourceText ? extractTitleFromText(sourceText) : sourceUrl || "Imported Recipe";
	const id = `${slugify(title) || "imported-recipe"}-${Date.now()}`;

	const recipe: Recipe = {
		id,
		title,
		source: sourceUrl || "Pasted text",
		heroImageUrl: input.imageDataUrl || PLACEHOLDER_RECIPE_IMAGE,
		excerpt: extractExcerpt(sourceText || `Imported from ${sourceUrl}`),
		prepTime: "TBD",
		cookTime: "TBD",
		servings: 4,
		mealType: "dinner",
		tags: ["imported"],
		ingredients: [{ qty: "", name: "Review imported ingredients" }],
		steps: extractStepsFromText(sourceText),
		notes: sourceUrl ? `Source: ${sourceUrl}` : "Imported from pasted text",
		isPublic: false,
	};

	store.recipes.unshift(recipe);
	return recipe;
}

export function getBlogPosts(includeUnpublished: boolean): BlogPost[] {
	if (includeUnpublished) {
		return store.blogPosts;
	}

	return store.blogPosts.filter((post) => post.isPublished);
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
	return store.blogPosts.find((post) => post.slug === slug);
}

export function createBlogPost(input: {
	title: string;
	body: string;
	excerpt?: string;
	heroImageUrl?: string;
	isPublished: boolean;
}): BlogPost {
	const nextSlug = uniqueSlug(input.title, store.blogPosts);
	const now = new Date().toISOString();
	const post: BlogPost = {
		id: `post-${Date.now()}`,
		slug: nextSlug,
		title: input.title.trim(),
		excerpt: input.excerpt?.trim() || extractExcerpt(input.body),
		body: input.body,
		heroImageUrl: input.heroImageUrl,
		publishedAt: input.isPublished ? now : null,
		isPublished: input.isPublished,
	};

	store.blogPosts.unshift(post);
	return post;
}

export function updateBlogPost(
	slug: string,
	input: Partial<{
		title: string;
		excerpt: string;
		body: string;
		heroImageUrl: string | null;
		isPublished: boolean;
	}>,
): BlogPost | undefined {
	const post = getBlogPostBySlug(slug);
	if (!post) {
		return undefined;
	}

	if (typeof input.title === "string" && input.title.trim()) {
		const candidate = input.title.trim();
		if (candidate !== post.title) {
			post.slug = uniqueSlug(candidate, store.blogPosts.filter((item) => item.id !== post.id));
		}
		post.title = candidate;
	}

	if (typeof input.excerpt === "string") {
		post.excerpt = input.excerpt.trim();
	}

	if (typeof input.body === "string") {
		post.body = input.body;
		if (!input.excerpt) {
			post.excerpt = extractExcerpt(input.body);
		}
	}

	if (input.heroImageUrl === null) {
		post.heroImageUrl = undefined;
	} else if (typeof input.heroImageUrl === "string") {
		post.heroImageUrl = input.heroImageUrl;
	}

	if (typeof input.isPublished === "boolean") {
		post.isPublished = input.isPublished;
		post.publishedAt = input.isPublished
			? post.publishedAt || new Date().toISOString()
			: null;
	}

	return post;
}

export function deleteBlogPost(slug: string): boolean {
	const startCount = store.blogPosts.length;
	store.blogPosts = store.blogPosts.filter((post) => post.slug !== slug);
	return store.blogPosts.length < startCount;
}

export function getFeaturedRecipes(): Recipe[] {
	return getRecipes(false).slice(0, 2);
}

export function getFeaturedPost(): BlogPost | undefined {
	return getBlogPosts(false)[0];
}
