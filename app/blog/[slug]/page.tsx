export default async function BlogPostPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	return <main style={{ padding: "2rem" }}>Blog post: {slug}</main>;
}