import Link from "next/link";

import type { BlogPost } from "@/lib/types";

type BlogListProps = {
	posts: BlogPost[];
};

export default function BlogList({ posts }: BlogListProps) {
	return (
		<section className="grid gap-6 md:grid-cols-2">
			{posts.map((post) => (
				<article key={post.id} className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-6">
					<p className="text-xs uppercase tracking-[0.16em] text-[--color-muted]">
						{post.isPublished && post.publishedAt
							? new Date(post.publishedAt).toLocaleDateString()
							: "Draft"}
					</p>
					<h2 className="mt-2 font-serif text-3xl text-[--color-ink]">{post.title}</h2>
					<p className="mt-3 text-sm leading-6 text-[--color-muted]">{post.excerpt}</p>
					<Link href={`/blog/${post.slug}`} className="mt-5 inline-block text-sm text-[--color-accent] hover:underline">
						Read story
					</Link>
				</article>
			))}
		</section>
	);
}