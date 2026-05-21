import { notFound } from "next/navigation";

import BlogPost from "@/components/BlogPost";
import { isAdmin } from "@/lib/admin";
import { auth0 } from "@/lib/auth0";
import { getBlogPostBySlug } from "@/lib/content";

export default async function BlogPostPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const session = await auth0.getSession();
	const post = await getBlogPostBySlug(slug, { includeUnpublished: isAdmin(session) });

	if (!post) {
		notFound();
	}

	return (
		<main className="space-y-10">
			<BlogPost post={post} />
		</main>
	);
}