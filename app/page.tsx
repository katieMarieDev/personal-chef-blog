import Link from "next/link";

import RecipeCard from "@/components/RecipeCard";
import { getFeaturedPost, getFeaturedRecipes } from "@/lib/mock-data";

export default function HomePage() {
	const featuredRecipes = getFeaturedRecipes();
	const featuredPost = getFeaturedPost();

	return (
		<main className="space-y-14 md:space-y-20">
			<section className="reveal rounded-3xl border border-[--color-border] bg-[--color-surface] p-8 md:p-12">
				<p className="text-xs uppercase tracking-[0.2em] text-[--color-muted]">Personal Chef Studio</p>
				<h1 className="mt-4 max-w-3xl text-5xl leading-tight text-[--color-ink] md:text-7xl">
					Seasonal meals, intimate dinners, and recipes that feel like home.
				</h1>
				<p className="mt-6 max-w-2xl text-lg leading-8 text-[--color-muted]">
					I cook warm, editorial-style food for busy households and milestone evenings. Browse recipes, read behind-the-scenes notes,
					or inquire about private chef service.
				</p>
				<div className="mt-8 flex flex-wrap gap-3">
					<Link href="/recipes" className="rounded-full bg-[--color-accent] px-6 py-3 text-sm uppercase tracking-[0.12em] text-[--color-surface]">
						Browse Recipes
					</Link>
					<Link href="/contact" className="rounded-full border border-[--color-border] px-6 py-3 text-sm uppercase tracking-[0.12em] text-[--color-ink]">
						Book a Consultation
					</Link>
				</div>
			</section>

		<section className="space-y-6">
			<div className="flex items-end justify-between">
				<h2 className="text-4xl">Featured Recipes</h2>
				<Link href="/recipes" className="text-sm uppercase tracking-[0.12em] text-[--color-accent]">
					See all
				</Link>
			</div>
			<div className="grid gap-6 md:grid-cols-2">
				{featuredRecipes.map((recipe) => (
					<RecipeCard key={recipe.id} recipe={recipe} />
				))}
			</div>
		</section>

		{featuredPost ? (
			<section className="rounded-3xl border border-[--color-border] bg-[--color-surface] p-8 md:p-10">
				<p className="text-xs uppercase tracking-[0.18em] text-[--color-muted]">From the Journal</p>
				<h3 className="mt-2 text-4xl">{featuredPost.title}</h3>
				<p className="mt-4 max-w-2xl text-[--color-muted]">{featuredPost.excerpt}</p>
				<Link href={`/blog/${featuredPost.slug}`} className="mt-6 inline-block text-sm uppercase tracking-[0.12em] text-[--color-accent]">
					Read article
				</Link>
			</section>
		) : null}
		</main>
	);
}