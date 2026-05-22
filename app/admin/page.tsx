import Link from "next/link";

import ImportCard from "@/components/ImportCard";
import { getBlogPosts, getRecipes } from "@/lib/content";

export default async function AdminPage() {
	const [allPosts, allRecipes] = await Promise.all([
		getBlogPosts({ includeUnpublished: true }),
		getRecipes(true),
	]);

	const publishedPosts = allPosts.filter((p) => p.isPublished);
	const draftPosts = allPosts.filter((p) => !p.isPublished);
	const publicRecipes = allRecipes.filter((r) => r.isPublic);
	const draftRecipes = allRecipes.filter((r) => !r.isPublic);

	return (
		<main className="space-y-10">
			<div className="space-y-3">
				<p className="text-xs uppercase tracking-[0.16em] text-[--color-muted]">Admin</p>
				<h1 className="text-5xl text-[--color-ink]">Dashboard</h1>
			</div>

			{/* ── BLOG ─────────────────────────────────────────────── */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="font-serif text-3xl text-[--color-ink]">Journal</h2>
					<Link
						href="/admin/blog/new"
						className="rounded-full bg-[--color-ink] px-5 py-2 text-sm text-[--color-surface] hover:opacity-80"
					>
						+ New Post
					</Link>
				</div>

				<section className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-6">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-medium text-[--color-ink]">Drafts</h3>
						<span className="text-xs uppercase tracking-[0.12em] text-[--color-muted]">
							{draftPosts.length} unpublished
						</span>
					</div>
					{draftPosts.length === 0 ? (
						<p className="mt-3 text-sm text-[--color-muted]">No drafts.</p>
					) : (
						<ul className="mt-3 divide-y divide-[--color-border]">
							{draftPosts.map((post) => (
								<li key={post.id} className="flex items-center justify-between py-3">
									<p className="font-medium text-[--color-ink]">{post.title}</p>
									<Link
										href={`/admin/blog/${post.slug}/edit`}
										className="rounded-full border border-[--color-border] px-4 py-1.5 text-sm text-[--color-ink] hover:border-[--color-accent]"
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
						<h3 className="text-lg font-medium text-[--color-ink]">Published</h3>
						<span className="text-xs uppercase tracking-[0.12em] text-[--color-muted]">
							{publishedPosts.length} live
						</span>
					</div>
					{publishedPosts.length === 0 ? (
						<p className="mt-3 text-sm text-[--color-muted]">No published posts yet.</p>
					) : (
						<ul className="mt-3 divide-y divide-[--color-border]">
							{publishedPosts.map((post) => (
								<li key={post.id} className="flex items-center justify-between py-3">
									<div>
										<p className="font-medium text-[--color-ink]">{post.title}</p>
										<p className="text-xs text-[--color-muted]">
											{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}
										</p>
									</div>
									<Link
										href={`/admin/blog/${post.slug}/edit`}
										className="rounded-full border border-[--color-border] px-4 py-1.5 text-sm text-[--color-ink] hover:border-[--color-accent]"
									>
										Edit
									</Link>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>

			{/* ── RECIPES ──────────────────────────────────────────── */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="font-serif text-3xl text-[--color-ink]">Recipes</h2>
				</div>

				<ImportCard />

				<section className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-6">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-medium text-[--color-ink]">Drafts</h3>
						<span className="text-xs uppercase tracking-[0.12em] text-[--color-muted]">
							{draftRecipes.length} private
						</span>
					</div>
					{draftRecipes.length === 0 ? (
						<p className="mt-3 text-sm text-[--color-muted]">No draft recipes.</p>
					) : (
						<ul className="mt-3 divide-y divide-[--color-border]">
							{draftRecipes.map((recipe) => (
								<li key={recipe.id} className="flex items-center justify-between py-3">
									<div>
										<p className="font-medium text-[--color-ink]">{recipe.title}</p>
										<p className="text-xs text-[--color-muted]">{recipe.mealType}</p>
									</div>
									<Link
										href={`/admin/recipes/${recipe.id}/edit`}
										className="rounded-full border border-[--color-border] px-4 py-1.5 text-sm text-[--color-ink] hover:border-[--color-accent]"
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
						<h3 className="text-lg font-medium text-[--color-ink]">Published</h3>
						<span className="text-xs uppercase tracking-[0.12em] text-[--color-muted]">
							{publicRecipes.length} live
						</span>
					</div>
					{publicRecipes.length === 0 ? (
						<p className="mt-3 text-sm text-[--color-muted]">No published recipes yet.</p>
					) : (
						<ul className="mt-3 divide-y divide-[--color-border]">
							{publicRecipes.map((recipe) => (
								<li key={recipe.id} className="flex items-center justify-between py-3">
									<div>
										<p className="font-medium text-[--color-ink]">{recipe.title}</p>
										<p className="text-xs text-[--color-muted]">{recipe.mealType}</p>
									</div>
									<Link
										href={`/admin/recipes/${recipe.id}/edit`}
										className="rounded-full border border-[--color-border] px-4 py-1.5 text-sm text-[--color-ink] hover:border-[--color-accent]"
									>
										Edit
									</Link>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>
		</main>
	);
}
