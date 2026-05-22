import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin";
import { auth0 } from "@/lib/auth0";
import { ensureUniqueBlogSlug, getBlogPostBySlug } from "@/lib/content";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

function excerptFromBody(body: string, maxLength = 160): string {
	const text = body.replace(/\s+/g, " ").trim();
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength).trimEnd()}...`;
}

async function uploadBlogImageIfNeeded(heroImageUrl?: string | null): Promise<string | null | undefined> {
	if (heroImageUrl === undefined) {
		return undefined;
	}

	if (heroImageUrl === null || heroImageUrl === "") {
		return null;
	}

	if (!heroImageUrl.startsWith("data:")) {
		return heroImageUrl;
	}

	const supabase = getSupabaseAdminClient();
	const matches = heroImageUrl.match(/^data:(.+);base64,(.+)$/);
	if (!matches) {
		return null;
	}

	const mediaType = matches[1];
	const data = matches[2];
	const extension = mediaType.split("/")[1] || "jpg";
	const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

	const { error } = await supabase.storage
		.from("recipe-photos")
		.upload(path, Buffer.from(data, "base64"), {
			contentType: mediaType,
			upsert: false,
		});

	if (error) {
		throw error;
	}

	const { data: publicUrl } = supabase.storage.from("recipe-photos").getPublicUrl(path);
	return publicUrl.publicUrl;
}

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params;
	const session = await auth0.getSession();
	const post = await getBlogPostBySlug(slug, {
		includeUnpublished: isAdmin(session),
	});

	if (!post) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	return NextResponse.json({ ok: true, post });
}

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;
		const session = await auth0.getSession();
		if (!isAdmin(session)) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = (await req.json()) as {
			title?: string;
			excerpt?: string;
			body?: string;
			heroImageUrl?: string | null;
			isPublished?: boolean;
		};

		const supabase = getSupabaseAdminClient();
		const existing = await getBlogPostBySlug(slug, { includeUnpublished: true });
		if (!existing) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		let nextSlug = slug;
		if (typeof body.title === "string" && body.title.trim() && body.title.trim() !== existing.title) {
			nextSlug = await ensureUniqueBlogSlug(body.title.trim(), slug);
		}

		const uploadedImageUrl = await uploadBlogImageIfNeeded(body.heroImageUrl);
		const publishedAt =
			typeof body.isPublished === "boolean"
				? body.isPublished
					? existing.publishedAt || new Date().toISOString()
					: null
				: undefined;

		const updatePayload: Record<string, string | null | undefined> = {
			title: body.title?.trim(),
			slug: nextSlug,
			excerpt: body.excerpt?.trim(),
			body: body.body,
			hero_image_url: uploadedImageUrl,
			published_at: publishedAt,
		};

		if (updatePayload.excerpt === undefined && body.body) {
			updatePayload.excerpt = excerptFromBody(body.body);
		}

		for (const key of Object.keys(updatePayload)) {
			if (updatePayload[key] === undefined) {
				delete updatePayload[key];
			}
		}

		const { data: updated, error } = await supabase
			.from("blog_posts")
			.update(updatePayload)
			.eq("slug", slug)
			.select("id, title, slug, body, excerpt, hero_image_url, published_at, created_at")
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		const post = {
			id: updated.id,
			slug: updated.slug,
			title: updated.title,
			excerpt: updated.excerpt ?? "",
			body: updated.body ?? "",
			heroImageUrl: updated.hero_image_url ?? undefined,
			publishedAt: updated.published_at,
			isPublished: !!updated.published_at,
		};

		return NextResponse.json({ ok: true, post });
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Unexpected error updating post" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;
		const session = await auth0.getSession();
		if (!isAdmin(session)) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const supabase = getSupabaseAdminClient();
		const { data: deletedRows, error } = await supabase
			.from("blog_posts")
			.delete()
			.eq("slug", slug)
			.select("id");
		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		if (!deletedRows || deletedRows.length === 0) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Unexpected error deleting post" },
			{ status: 500 },
		);
	}
}