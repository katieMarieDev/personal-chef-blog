"use client";

import { useMemo, useState } from "react";

import type { Recipe } from "@/lib/types";

import RecipeCard from "./RecipeCard";

type RecipeGridProps = {
	recipes: Recipe[];
};

export default function RecipeGrid({ recipes }: RecipeGridProps) {
	const [search, setSearch] = useState("");

	const filteredRecipes = useMemo(() => {
		const normalized = search.trim().toLowerCase();
		if (!normalized) {
			return recipes;
		}

		return recipes.filter((recipe) => {
			return (
				recipe.title.toLowerCase().includes(normalized) ||
				recipe.tags.some((tag) => tag.includes(normalized)) ||
				recipe.mealType.includes(normalized)
			);
		});
	}, [recipes, search]);

	return (
		<section className="space-y-6">
			<input
				type="search"
				value={search}
				onChange={(event) => setSearch(event.target.value)}
				placeholder="Search by name, meal type, or tag"
				className="w-full rounded-2xl border border-[--color-border] bg-[--color-surface] px-4 py-3 text-[--color-ink] outline-none ring-[--color-accent] transition focus:ring-2"
			/>
			<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
				{filteredRecipes.map((recipe) => (
					<RecipeCard key={recipe.id} recipe={recipe} />
				))}
			</div>
			{filteredRecipes.length === 0 ? (
				<p className="rounded-xl border border-dashed border-[--color-border] p-6 text-center text-[--color-muted]">
					No recipes match that search yet.
				</p>
			) : null}
		</section>
	);
}