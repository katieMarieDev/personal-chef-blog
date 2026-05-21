import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import { ensureUniqueBlogSlug, getBlogPosts } from "@/lib/content";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

function excerptFromBody(body: string, maxLength = 160): string {
	const text = body.replace(/\s+/g, " ").trim();
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength).trimEnd()}...`;
}

async function uploadBlogImageIfNeeded(heroImageUrl?: string): Promise<string | null> {
	if (!heroImageUrl) {
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

export async function GET() {
	const session = await auth0.getSession();
	const posts = await getBlogPosts({ includeUnpublished: !!session });

	return NextResponse.json({ ok: true, posts });
}

export async function POST(req: Request) {
	const session = await auth0.getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = (await req.json()) as {
		title?: string;
		excerpt?: string;
		body?: string;
		heroImageUrl?: string;
		isPublished?: boolean;
	};

	if (!body.title?.trim() || !body.body?.trim()) {
		return NextResponse.json(
			{ error: "Title and body are required" },
			{ status: 400 },
		);
	}

	const supabase = getSupabaseAdminClient();
	const slug = await ensureUniqueBlogSlug(body.title);
	const heroImageUrl = await uploadBlogImageIfNeeded(body.heroImageUrl);
	const publishedAt = body.isPublished === false ? null : new Date().toISOString();
	const insertPayload: Record<string, string | null> = {
		title: body.title.trim(),
		slug,
		body: body.body,
		excerpt: body.excerpt?.trim() || excerptFromBody(body.body),
		hero_image_url: heroImageUrl,
		published_at: publishedAt,
	};

	const { data: inserted, error } = await supabase
		.from("blog_posts")
		.insert(insertPayload)
		.select("id, title, slug, body, excerpt, hero_image_url, published_at, created_at")
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	const post = {
		id: inserted.id,
		slug: inserted.slug,
		title: inserted.title,
		excerpt: inserted.excerpt ?? "",
		body: inserted.body ?? "",
		heroImageUrl: inserted.hero_image_url ?? undefined,
		publishedAt: inserted.published_at,
		isPublished: !!inserted.published_at,
	};

	return NextResponse.json({ ok: true, post }, { status: 201 });
}