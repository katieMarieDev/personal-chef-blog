import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import { getRecipeById } from "@/lib/content";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const session = await auth0.getSession();
	const recipe = await getRecipeById(id, !!session);

	if (!recipe) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	return NextResponse.json({ ok: true, recipe });
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