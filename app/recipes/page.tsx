import RecipeGrid from "@/components/RecipeGrid";
import { recipes } from "@/lib/mock-data";

export default function RecipesPage() {
	const publicRecipes = recipes.filter((recipe) => recipe.isPublic);

	return (
		<main className="space-y-6">
			<h1 className="text-5xl">Recipe Collection</h1>
			<p className="max-w-2xl text-[--color-muted]">
				Search by dish, tag, or meal type. This public grid mirrors what guests will see while admin editing tools stay private.
			</p>
			<RecipeGrid recipes={publicRecipes} />
		</main>
	);
}