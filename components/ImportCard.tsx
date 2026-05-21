"use client";

import { FormEvent, useState } from "react";

export default function ImportCard() {
	const [mode, setMode] = useState<"url" | "text">("url");
	const [status, setStatus] = useState("");

	async function handleImport(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setStatus("Importing recipe...");

		const formData = new FormData(event.currentTarget);
		formData.set("mode", mode);

		try {
			const response = await fetch("/api/import", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				throw new Error("Import failed");
			}

			const payload = (await response.json()) as { recipe?: { title: string } };

			setStatus(`Imported "${payload.recipe?.title ?? "recipe"}" as a private draft.`);
			event.currentTarget.reset();
		} catch {
			setStatus("Could not import right now.");
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