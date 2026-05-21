import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
}

function titleFromText(text: string): string {
	const lines = text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	const heading = lines.find((line) => line.startsWith("#"));
	if (heading) {
		return heading.replace(/^#+\s*/, "").trim();
	}

	return lines[0] || "Imported Recipe";
}

function excerptFromText(text: string, maxLength = 160): string {
	const cleaned = text.replace(/\s+/g, " ").trim();
	if (cleaned.length <= maxLength) {
		return cleaned;
	}
	return `${cleaned.slice(0, maxLength).trimEnd()}...`;
}

function stepsFromText(text: string): string[] {
	const lines = text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.filter((line) => !line.startsWith("#"));

	return lines.slice(0, 10);
}

async function fileToDataUrl(file: File): Promise<string> {
	const bytes = Buffer.from(await file.arrayBuffer());
	return `data:${file.type};base64,${bytes.toString("base64")}`;
}

async function uploadDataUrlToStorage(dataUrl: string): Promise<string> {
	const supabase = getSupabaseAdminClient();
	const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
	if (!matches) {
		throw new Error("Invalid image data");
	}

	const mediaType = matches[1];
	const data = matches[2];
	const extension = mediaType.split("/")[1] || "jpg";
	const path = `imports/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

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

export async function POST(req: Request) {
	const session = await auth0.getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const contentType = req.headers.get("content-type") ?? "";
	let mode = "url";
	let url = "";
	let text = "";
	let imageDataUrl: string | undefined;

	if (contentType.includes("application/json")) {
		const body = (await req.json()) as {
			mode?: string;
			url?: string;
			text?: string;
		};
		mode = body.mode ?? "url";
		url = body.url ?? "";
		text = body.text ?? "";
	} else {
		const form = await req.formData();
		mode = String(form.get("mode") ?? "url");
		url = String(form.get("sourceUrl") ?? "");
		text = String(form.get("recipeText") ?? "");
		const file = form.get("recipeImage");
		if (file instanceof File && file.size > 0) {
			imageDataUrl = await fileToDataUrl(file);
		}
	}

	if (mode === "url" && !url.trim()) {
		return NextResponse.json({ error: "Recipe URL is required" }, { status: 400 });
	}

	if (mode === "text" && !text.trim()) {
		return NextResponse.json({ error: "Recipe text is required" }, { status: 400 });
	}

	const supabase = getSupabaseAdminClient();
	const normalizedText = text.trim();
	const title = mode === "text" ? titleFromText(normalizedText) : url;
	const source = mode === "text" ? "Pasted text" : "URL import";
	const sourceUrl = mode === "url" ? url.trim() : null;
	const uploadedHero = imageDataUrl ? await uploadDataUrlToStorage(imageDataUrl) : null;
	const recipeInsertPayload: Record<string, string | number | boolean | string[] | null> = {
		title: title,
		source,
		source_url: sourceUrl,
		steps: mode === "text" ? stepsFromText(normalizedText) : ["Review imported recipe details before publishing."],
		notes: mode === "text" ? excerptFromText(normalizedText) : `Imported from ${sourceUrl}`,
		is_public: false,
		meal_type: "dinner",
		servings: 4,
		prep_time: "TBD",
		cook_time: "TBD",
		imported_via: mode,
		hero_image_url: uploadedHero,
	};

	const { data: inserted, error } = await supabase
		.from("recipes")
		.insert(recipeInsertPayload)
		.select("id, title")
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	const { error: ingredientError } = await supabase.from("ingredients").insert({
		recipe_id: inserted.id,
		qty: "",
		name: "Review imported ingredients",
	});

	if (ingredientError) {
		return NextResponse.json({ error: ingredientError.message }, { status: 500 });
	}

	const { error: tagError } = await supabase.from("recipe_tags").insert({
		recipe_id: inserted.id,
		tag: "imported",
	});

	if (tagError) {
		return NextResponse.json({ error: tagError.message }, { status: 500 });
	}

	const recipe = {
		id: inserted.id,
		title: inserted.title || slugify(title),
	};

	return NextResponse.json({ ok: true, recipe }, { status: 201 });
}