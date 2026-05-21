import Image from "next/image";
import Link from "next/link";

import type { Recipe } from "@/lib/types";

type RecipeDetailProps = {
	recipe: Recipe;
	isAdmin: boolean;
};

export default function RecipeDetail({ recipe, isAdmin }: RecipeDetailProps) {
	const editButton = isAdmin ? (
		<Link
			href={`/admin?editRecipe=${recipe.id}`}
			className="rounded-full border border-[--color-border] px-4 py-2 text-sm text-[--color-ink] hover:border-[--color-accent]"
		>
			Edit Recipe
		</Link>
	) : null;

	return (
		<article className="mx-auto max-w-4xl space-y-8">
			<div className="space-y-4">
				<p className="text-xs uppercase tracking-[0.2em] text-[--color-muted]">{recipe.mealType}</p>
				<h1 className="font-serif text-4xl text-[--color-ink] md:text-5xl">{recipe.title}</h1>
				<p className="text-[--color-muted]">{recipe.excerpt}</p>
			</div>
			<div className="relative h-80 overflow-hidden rounded-3xl border border-[--color-border]">
				<Image src={recipe.heroImageUrl} alt={recipe.title} fill className="object-cover" sizes="100vw" />
			</div>
			<div className="flex flex-wrap gap-4 text-sm text-[--color-muted]">
				<span>Prep: {recipe.prepTime}</span>
				<span>Cook: {recipe.cookTime}</span>
				<span>Serves: {recipe.servings}</span>
				{editButton}
			</div>
			<section className="grid gap-8 md:grid-cols-[1fr_1.3fr]">
				<div className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-6">
					<h2 className="font-serif text-2xl">Ingredients</h2>
					<ul className="mt-4 space-y-2 text-sm text-[--color-muted]">
						{recipe.ingredients.map((ingredient) => (
							<li key={`${ingredient.qty}-${ingredient.name}`}>
								{ingredient.qty} {ingredient.unit ?? ""} {ingredient.name}
							</li>
						))}
					</ul>
				</div>
				<div className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-6">
					<h2 className="font-serif text-2xl">Method</h2>
					<ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-[--color-muted]">
						{recipe.steps.map((step) => (
							<li key={step}>{step}</li>
						))}
					</ol>
				</div>
			</section>
		</article>
	);
}