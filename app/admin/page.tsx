import Link from "next/link";

import ImportCard from "@/components/ImportCard";
import { getBlogPosts, getRecipes } from "@/lib/content";

export default async function AdminPage() {
	const [publishedPosts, publicRecipes] = await Promise.all([
		getBlogPosts({ includeUnpublished: false }),
		getRecipes(false),
	]);

	return (
		<main className="space-y-8">
			<div className="space-y-3">
				<p className="text-xs uppercase tracking-[0.16em] text-[--color-muted]">Admin</p>
				<h1 className="text-5xl text-[--color-ink]">Dashboard</h1>
				<p className="max-w-3xl text-[--color-muted]">
					You are signed in. Manage published content here, or create new entries.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Link href="/admin/blog/new" className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-6 hover:border-[--color-accent]">
					<h2 className="text-2xl">Write New Blog Post</h2>
					<p className="mt-2 text-sm text-[--color-muted]">Create and publish your next journal entry.</p>
				</Link>
				<Link href="/recipes" className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-6 hover:border-[--color-accent]">
					<h2 className="text-2xl">View Recipe Collection</h2>
					<p className="mt-2 text-sm text-[--color-muted]">Open any published recipe and use admin edit controls.</p>
				</Link>
			</div>

			<section className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl text-[--color-ink]">Published Blog Posts</h2>
					<span className="text-xs uppercase tracking-[0.12em] text-[--color-muted]">
						{publishedPosts.length} live
					</span>
				</div>
				{publishedPosts.length === 0 ? (
					<p className="mt-3 text-sm text-[--color-muted]">No published blog posts yet.</p>
				) : (
					<ul className="mt-4 divide-y divide-[--color-border]">
						{publishedPosts.map((post) => (
							<li key={post.id} className="flex items-center justify-between py-3">
								<div>
									<p className="font-medium text-[--color-ink]">{post.title}</p>
									<p className="text-xs text-[--color-muted]">
										{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "Published"}
									</p>
								</div>
								<Link
									href={`/admin/blog/${post.slug}/edit`}
									className="rounded-full border border-[--color-border] px-4 py-2 text-sm text-[--color-ink] hover:border-[--color-accent]"
								>
									Edit
								</Link>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl text-[--color-ink]">Published Recipes</h2>
					<span className="text-xs uppercase tracking-[0.12em] text-[--color-muted]">
						{publicRecipes.length} live
					</span>
				</div>
				{publicRecipes.length === 0 ? (
					<p className="mt-3 text-sm text-[--color-muted]">No published recipes yet.</p>
				) : (
					<ul className="mt-4 divide-y divide-[--color-border]">
						{publicRecipes.map((recipe) => (
							<li key={recipe.id} className="flex items-center justify-between py-3">
								<div>
									<p className="font-medium text-[--color-ink]">{recipe.title}</p>
									<p className="text-xs text-[--color-muted]">{recipe.mealType}</p>
								</div>
								<Link
									href={`/recipes/${recipe.id}`}
									className="rounded-full border border-[--color-border] px-4 py-2 text-sm text-[--color-ink] hover:border-[--color-accent]"
								>
									Edit
								</Link>
							</li>
						))}
					</ul>
				)}
			</section>

			<ImportCard />
		</main>
	);
}