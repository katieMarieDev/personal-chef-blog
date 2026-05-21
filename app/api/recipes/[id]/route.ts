import { NextResponse } from "next/server";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	return NextResponse.json({ ok: true, route: "recipes/[id]", id });
}

export async function PATCH(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	return NextResponse.json({ ok: true, route: "recipes/[id]", id });
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	return NextResponse.json({ ok: true, route: "recipes/[id]", id });
}