import Image from "next/image";

import type { BlogPost as BlogPostType } from "@/lib/types";

type BlogPostProps = {
	post: BlogPostType;
	isAdmin: boolean;
};

export default function BlogPost({ post, isAdmin }: BlogPostProps) {
	return (
		<article className="mx-auto max-w-3xl space-y-6">
			<p className="text-xs uppercase tracking-[0.16em] text-[--color-muted]">{post.publishedAt}</p>
			<h1 className="font-serif text-4xl text-[--color-ink] md:text-5xl">{post.title}</h1>
			{post.heroImageUrl ? (
				<div className="relative h-80 overflow-hidden rounded-3xl border border-[--color-border]">
					<Image src={post.heroImageUrl} alt={post.title} fill sizes="100vw" className="object-cover" />
				</div>
			) : null}
			<p className="text-base leading-8 text-[--color-muted]">{post.body}</p>
			{isAdmin ? (
				<p className="inline-block rounded-full border border-[--color-border] px-4 py-2 text-xs uppercase tracking-[0.12em] text-[--color-muted]">
					Admin view: edit controls enabled in full editor pass
				</p>
			) : null}
		</article>
	);
}