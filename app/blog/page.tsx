import BlogList from "@/components/BlogList";
import { getBlogPosts } from "@/lib/content";

export default async function BlogIndexPage() {
	const blogPosts = await getBlogPosts({ includeUnpublished: false });

	return (
		<main className="space-y-6">
			<h1 className="text-5xl">Kitchen Journal</h1>
			<p className="max-w-2xl text-[--color-muted]">
				Notes from private dinners, menu planning strategies, and stories from service.
			</p>
			<BlogList posts={blogPosts} />
		</main>
	);
}