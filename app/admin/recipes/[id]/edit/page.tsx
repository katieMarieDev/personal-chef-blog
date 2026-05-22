import { notFound } from "next/navigation";

import RecipeEditorForm from "@/components/RecipeEditorForm";
import { getRecipeById } from "@/lib/content";

export default async function AdminEditRecipePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const recipe = await getRecipeById(id, true);

	if (!recipe) {
		notFound();
	}

	return (
		<main className="mx-auto max-w-6xl">
			<RecipeEditorForm mode="edit" initialRecipe={recipe} />
		</main>
	);
}