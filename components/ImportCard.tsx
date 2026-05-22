"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = String(reader.result ?? "");
			const payload = result.split(",")[1] || "";
			resolve(payload);
		};
		reader.onerror = () => reject(new Error("Unable to read image file."));
		reader.readAsDataURL(file);
	});
}

export default function ImportCard() {
	const router = useRouter();
	const [mode, setMode] = useState<"url" | "text">("url");
	const [status, setStatus] = useState("");

	async function handleImport(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setStatus("Importing recipe...");

		const form = event.currentTarget;
		const formData = new FormData(form);
		const url = mode === "url" ? (formData.get("sourceUrl") as string) : undefined;
		const text = mode === "text" ? (formData.get("recipeText") as string) : undefined;
		const imageFile = formData.get("recipeImage") as File | null;

		// Read image file as base64 if provided
		let fileBase64: string | undefined;
		let fileMediaType: string | undefined;
		if (imageFile && imageFile.size > 0) {
			fileBase64 = await fileToBase64(imageFile);
			fileMediaType = imageFile.type;
		}

		const body: Record<string, unknown> = {};
		if (url) body.url = url;
		if (text) body.text = text;
		if (fileBase64) { body.fileBase64 = fileBase64; body.fileMediaType = fileMediaType; }

		try {
			const response = await fetch("/api/import", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
				throw new Error(errorPayload?.error || "Import failed");
			}

			await response.json(); // recipeId available if needed

			setStatus(`Recipe imported as a private draft.`);
			form.reset();
			router.refresh();
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "Could not import right now.");
		}
	}

	return (
		<section className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-5">
			<h3 className="font-serif text-2xl">AI Recipe Import</h3>
			<form onSubmit={handleImport} className="mt-4 space-y-3">
				<div className="flex flex-wrap gap-2 text-sm">
					<button
						type="button"
						onClick={() => setMode("url")}
						className={`rounded-full border px-4 py-1.5 transition ${
							mode === "url"
								? "border-[--color-ink] bg-[--color-ink] text-[--color-surface]"
								: "border-[--color-border] text-[--color-muted] hover:border-[--color-ink]"
						}`}
					>
						URL Import
					</button>
					<button
						type="button"
						onClick={() => setMode("text")}
						className={`rounded-full border px-4 py-1.5 transition ${
							mode === "text"
								? "border-[--color-ink] bg-[--color-ink] text-[--color-surface]"
								: "border-[--color-border] text-[--color-muted] hover:border-[--color-ink]"
						}`}
					>
						Copy/Paste Text
					</button>
				</div>

				{mode === "url" ? (
					<input
						name="sourceUrl"
						required
						type="url"
						placeholder="Paste recipe URL"
						className="w-full rounded-xl border border-[--color-border] bg-white px-4 py-3"
					/>
				) : (
					<textarea
						name="recipeText"
						required
						rows={8}
						placeholder="Paste full recipe text here"
						className="w-full rounded-xl border border-[--color-border] bg-white px-4 py-3"
					/>
				)}

				<label className="block text-sm text-[--color-muted]">Optional hero image</label>
				<input
					name="recipeImage"
					type="file"
					accept="image/*"
					className="block w-full text-sm text-[--color-muted]"
				/>

				<button type="submit" className="rounded-full bg-[--color-ink] px-5 py-2 text-sm text-[--color-surface]">
					Import
				</button>
			</form>
			{status ? <p className="mt-3 text-sm text-[--color-muted]">{status}</p> : null}
		</section>
	);
}