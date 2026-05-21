import { notFound } from "next/navigation";

import RecipeDetail from "@/components/RecipeDetail";
import { isAdmin } from "@/lib/admin";
import { auth0 } from "@/lib/auth0";
import { getRecipeById } from "@/lib/content";

export default async function RecipeDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const session = await auth0.getSession();
	const recipe = await getRecipeById(id, isAdmin(session));

	if (!recipe) {
		notFound();
	}

	return <RecipeDetail recipe={recipe} isAdmin={isAdmin(session)} />;
}