"use client";

import { FormEvent, useState } from "react";

type SubmitState = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
	const [state, setState] = useState<SubmitState>("idle");
	const [errorMessage, setErrorMessage] = useState("");

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setState("sending");
		setErrorMessage("");

		const formData = new FormData(event.currentTarget);
		const payload = {
			name: String(formData.get("name") ?? ""),
			email: String(formData.get("email") ?? ""),
			serviceType: String(formData.get("serviceType") ?? ""),
			message: String(formData.get("message") ?? ""),
		};

		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error("Could not send inquiry right now.");
			}

			event.currentTarget.reset();
			setState("sent");
		} catch (error) {
			setState("error");
			setErrorMessage(error instanceof Error ? error.message : "Unexpected error.");
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-[--color-border] bg-[--color-surface] p-6">
			<div className="grid gap-4 md:grid-cols-2">
				<input required name="name" placeholder="Your name" className="rounded-xl border border-[--color-border] bg-white px-4 py-3" />
				<input required type="email" name="email" placeholder="Email" className="rounded-xl border border-[--color-border] bg-white px-4 py-3" />
			</div>
			<select name="serviceType" className="w-full rounded-xl border border-[--color-border] bg-white px-4 py-3">
				<option value="private-dinners">Private dinners</option>
				<option value="weekly-meal-prep">Weekly meal prep</option>
				<option value="event-catering">Small event catering</option>
			</select>
			<textarea required name="message" rows={6} placeholder="Tell me what you need..." className="w-full rounded-xl border border-[--color-border] bg-white px-4 py-3" />
			<button
				type="submit"
				disabled={state === "sending"}
				className="rounded-full bg-[--color-accent] px-6 py-3 text-sm uppercase tracking-[0.1em] text-[--color-surface] disabled:opacity-70"
			>
				{state === "sending" ? "Sending..." : "Send Inquiry"}
			</button>
			{state === "sent" ? <p className="text-sm text-green-700">Thanks, your message is on its way.</p> : null}
			{state === "error" ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
		</form>
	);
}