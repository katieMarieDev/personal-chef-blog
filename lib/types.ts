export type Ingredient = {
	qty: string;
	unit?: string;
	name: string;
};

export type Recipe = {
	id: string;
	title: string;
	source: string;
	heroImageUrl: string;
	excerpt: string;
	prepTime: string;
	cookTime: string;
	servings: number;
	mealType: "breakfast" | "lunch" | "dinner" | "dessert" | "snack";
	tags: string[];
	ingredients: Ingredient[];
	steps: string[];
	notes?: string;
	isPublic: boolean;
};

export type BlogPost = {
	id: string;
	slug: string;
	title: string;
	excerpt: string;
	body: string;
	heroImageUrl?: string;
	publishedAt: string;
};
