export default async function AdminEditBlogPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	return <main style={{ padding: "2rem" }}>Edit post: {slug}</main>;
}