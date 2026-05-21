import { notFound } from "next/navigation";

import BlogEditorForm from "@/components/BlogEditorForm";
import { getBlogPostBySlug } from "@/lib/content";

export default async function AdminEditBlogPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const post = await getBlogPostBySlug(slug, { includeUnpublished: true });

	if (!post) {
		notFound();
	}

	return (
		<main className="mx-auto max-w-2xl space-y-8">
			<h1 className="text-4xl">Edit Blog Post</h1>
			<BlogEditorForm mode="edit" initialPost={post} />
		</main>
	);
}