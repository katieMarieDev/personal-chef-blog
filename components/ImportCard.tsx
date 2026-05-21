"use client";

import { FormEvent, useState } from "react";

export default function ImportCard() {
	const [status, setStatus] = useState("");

	async function handleImport(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setStatus("Importing recipe...");

		const formData = new FormData(event.currentTarget);
		const sourceUrl = String(formData.get("sourceUrl") ?? "");

		try {
			const response = await fetch("/api/import", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url: sourceUrl }),
			});

			if (!response.ok) {
				throw new Error("Import failed");
			}

			setStatus("Import request received. Wire this route to Claude + Supabase next.");
		} catch {
			setStatus("Could not import right now.");
		}
	}

	return (
		<section className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-5">
			<h3 className="font-serif text-2xl">AI Recipe Import</h3>
			<form onSubmit={handleImport} className="mt-4 space-y-3">
				<input name="sourceUrl" placeholder="Paste recipe URL" className="w-full rounded-xl border border-[--color-border] bg-white px-4 py-3" />
				<button type="submit" className="rounded-full bg-[--color-ink] px-5 py-2 text-sm text-[--color-surface]">
					Import
				</button>
			</form>
			{status ? <p className="mt-3 text-sm text-[--color-muted]">{status}</p> : null}
		</section>
	);
}