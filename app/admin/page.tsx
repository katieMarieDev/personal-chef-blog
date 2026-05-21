import Link from "next/link";

import ImportCard from "@/components/ImportCard";

export default function AdminPage() {
	return (
		<main className="space-y-8">
			<div className="space-y-3">
				<p className="text-xs uppercase tracking-[0.16em] text-[--color-muted]">Admin</p>
				<h1 className="text-5xl text-[--color-ink]">Dashboard</h1>
				<p className="max-w-3xl text-[--color-muted]">
					You are signed in. From here, you can import recipes, manage blog posts, and update site content.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Link href="/admin/blog/new" className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-6 hover:border-[--color-accent]">
					<h2 className="text-2xl">Write New Blog Post</h2>
					<p className="mt-2 text-sm text-[--color-muted]">Create and publish your next journal entry.</p>
				</Link>
				<Link href="/recipes" className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-6 hover:border-[--color-accent]">
					<h2 className="text-2xl">Review Public Recipes</h2>
					<p className="mt-2 text-sm text-[--color-muted]">Check how your recipes appear to site visitors.</p>
				</Link>
			</div>

			<ImportCard />
		</main>
	);
}