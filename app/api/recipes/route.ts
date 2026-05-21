import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin";
import { auth0 } from "@/lib/auth0";
import { getRecipes } from "@/lib/content";

export async function GET() {
	const session = await auth0.getSession();
	const recipes = await getRecipes(isAdmin(session));

	return NextResponse.json({ ok: true, recipes });
}