import Image from "next/image";

import type { BlogPost as BlogPostType } from "@/lib/types";

type BlogPostProps = {
	post: BlogPostType;
};

export default function BlogPost({ post }: BlogPostProps) {
	return (
		<article className="mx-auto max-w-3xl space-y-6">
			<p className="text-xs uppercase tracking-[0.16em] text-[--color-muted]">
				{post.isPublished && post.publishedAt
					? new Date(post.publishedAt).toLocaleDateString()
					: "Draft"}
			</p>
			<h1 className="font-serif text-4xl text-[--color-ink] md:text-5xl">{post.title}</h1>
			{post.heroImageUrl ? (
				<div className="relative h-80 overflow-hidden rounded-3xl border border-[--color-border]">
					<Image src={post.heroImageUrl} alt={post.title} fill sizes="100vw" className="object-cover" />
				</div>
			) : null}
			<p className="text-base leading-8 text-[--color-muted]">{post.body}</p>
		</article>
	);
}