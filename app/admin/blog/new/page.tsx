import BlogEditorForm from "@/components/BlogEditorForm";

export default function AdminNewBlogPage() {
	return (
		<main className="mx-auto max-w-2xl space-y-8">
			<h1 className="text-4xl">New Blog Post</h1>
			<BlogEditorForm mode="create" />
		</main>
	);
}