import { notFound } from "next/navigation";

import RecipeDetail from "@/components/RecipeDetail";
import { isAdmin } from "@/lib/admin";
import { auth0 } from "@/lib/auth0";
import { findRecipeById } from "@/lib/mock-data";

export default async function RecipeDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const recipe = findRecipeById(id);

	if (!recipe) {
		notFound();
	}

	const session = await auth0.getSession();

	return <RecipeDetail recipe={recipe} isAdmin={isAdmin(session)} />;
}