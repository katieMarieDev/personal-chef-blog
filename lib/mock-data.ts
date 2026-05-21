import type { BlogPost, Recipe } from "@/lib/types";

export const chefName = "Mamma Made It";

export const recipes: Recipe[] = [
	{
		id: "sun-dried-tomato-risotto",
		title: "Sun-Dried Tomato Risotto",
		source: "Family notebook",
		heroImageUrl:
			"https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1200&q=80",
		excerpt: "Creamy arborio rice with roasted garlic, basil, and parmesan.",
		prepTime: "15 min",
		cookTime: "30 min",
		servings: 4,
		mealType: "dinner",
		tags: ["italian", "comfort", "vegetarian"],
		ingredients: [
			{ qty: "1.5", unit: "cups", name: "arborio rice" },
			{ qty: "5", unit: "cups", name: "warm vegetable stock" },
			{ qty: "0.5", unit: "cup", name: "sun-dried tomatoes, chopped" },
			{ qty: "0.5", unit: "cup", name: "parmesan" },
			{ qty: "2", unit: "tbsp", name: "butter" },
		],
		steps: [
			"Sweat onion in olive oil until translucent.",
			"Toast arborio rice for 1-2 minutes.",
			"Add stock one ladle at a time, stirring often.",
			"Fold in tomatoes, butter, and parmesan at the end.",
		],
		notes: "Finish with lemon zest for brightness.",
		isPublic: true,
	},
	{
		id: "honey-thyme-roast-chicken",
		title: "Honey Thyme Roast Chicken",
		source: "Sunday service menu",
		heroImageUrl:
			"https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=1200&q=80",
		excerpt: "Golden roast chicken with citrus glaze and pan jus.",
		prepTime: "20 min",
		cookTime: "75 min",
		servings: 6,
		mealType: "dinner",
		tags: ["main", "roast", "family-style"],
		ingredients: [
			{ qty: "1", name: "whole chicken" },
			{ qty: "3", unit: "tbsp", name: "honey" },
			{ qty: "2", unit: "tbsp", name: "fresh thyme" },
			{ qty: "1", unit: "whole", name: "lemon" },
		],
		steps: [
			"Pat chicken dry and season generously.",
			"Brush with honey-thyme mixture.",
			"Roast until juices run clear and skin crisps.",
			"Rest for 15 minutes before carving.",
		],
		isPublic: true,
	},
	{
		id: "olive-oil-cake",
		title: "Citrus Olive Oil Cake",
		source: "Bakery test batch",
		heroImageUrl:
			"https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
		excerpt: "Tender crumb, orange syrup, and flaky sea salt.",
		prepTime: "20 min",
		cookTime: "45 min",
		servings: 8,
		mealType: "dessert",
		tags: ["cake", "citrus", "bake"],
		ingredients: [
			{ qty: "2", unit: "cups", name: "flour" },
			{ qty: "1", unit: "cup", name: "sugar" },
			{ qty: "0.75", unit: "cup", name: "olive oil" },
			{ qty: "3", name: "eggs" },
		],
		steps: [
			"Whisk wet ingredients until glossy.",
			"Fold in dry ingredients gently.",
			"Bake until center springs back.",
			"Soak with warm citrus syrup.",
		],
		isPublic: true,
	},
];

export const blogPosts: BlogPost[] = [
	{
		id: "1",
		slug: "welcome-to-my-kitchen",
		title: "Welcome to My Kitchen",
		excerpt:
			"A little about my cooking philosophy and what you can expect from this site.",
		body: "I cook for people first. That means flavor, texture, and timing matter as much as presentation. This site is where I share the recipes I actually make for clients and family.",
		heroImageUrl:
			"https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80",
		publishedAt: "2026-05-18",
	},
	{
		id: "2",
		slug: "how-i-plan-a-weekly-menu",
		title: "How I Plan a Weekly Menu",
		excerpt:
			"My practical process for balancing prep time, seasonality, and family requests.",
		body: "I start with one anchor dish, then build complementary meals that re-use prep smartly. A roast on Monday becomes wraps on Tuesday and stock by Wednesday.",
		publishedAt: "2026-05-20",
	},
];

export function getFeaturedRecipes(): Recipe[] {
	return recipes.slice(0, 2);
}

export function getFeaturedPost(): BlogPost | undefined {
	return blogPosts[0];
}

export function findRecipeById(id: string): Recipe | undefined {
	return recipes.find((recipe) => recipe.id === id);
}

export function findBlogBySlug(slug: string): BlogPost | undefined {
	return blogPosts.find((post) => post.slug === slug);
}
