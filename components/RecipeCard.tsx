import Image from "next/image";
import Link from "next/link";

import type { Recipe } from "@/lib/types";

type RecipeCardProps = {
	recipe: Recipe;
};

export default function RecipeCard({ recipe }: RecipeCardProps) {
	return (
		<article className="group overflow-hidden rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
			<div className="relative h-52 overflow-hidden">
				<Image
					src={recipe.heroImageUrl}
					alt={recipe.title}
					fill
					sizes="(max-width: 768px) 100vw, 33vw"
					className="object-cover transition duration-500 group-hover:scale-105"
				/>
			</div>
			<div className="space-y-3 p-5">
				<p className="text-xs uppercase tracking-[0.18em] text-[--color-muted]">{recipe.mealType}</p>
				<h3 className="font-serif text-2xl text-[--color-ink]">{recipe.title}</h3>
				<p className="text-sm text-[--color-muted]">{recipe.excerpt}</p>
				<div className="flex items-center justify-between text-xs text-[--color-muted]">
					<span>Prep {recipe.prepTime}</span>
					<span>Cook {recipe.cookTime}</span>
				</div>
				<Link
					href={`/recipes/${recipe.id}`}
					className="inline-block rounded-full border border-[--color-border] px-4 py-2 text-sm text-[--color-ink] transition hover:border-[--color-accent] hover:text-[--color-accent]"
				>
					See Recipe
				</Link>
			</div>
		</article>
	);
}