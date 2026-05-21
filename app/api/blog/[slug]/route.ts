import { NextResponse } from "next/server";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params;
	return NextResponse.json({ ok: true, route: "blog/[slug]", slug });
}

export async function PATCH(
	_req: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params;
	return NextResponse.json({ ok: true, route: "blog/[slug]", slug });
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params;
	return NextResponse.json({ ok: true, route: "blog/[slug]", slug });
}