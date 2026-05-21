export default async function RecipeDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <main style={{ padding: "2rem" }}>Recipe: {id}</main>;
}