"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import type { BlogPost } from "@/lib/types";

type BlogEditorFormProps = {
	initialPost?: BlogPost;
	mode: "create" | "edit";
};

function toIsoDateLabel(value?: string | null): string {
	if (!value) {
		return "Draft";
	}

	return new Date(value).toLocaleDateString();
}

export default function BlogEditorForm({ initialPost, mode }: BlogEditorFormProps) {
	const router = useRouter();
	const [title, setTitle] = useState(initialPost?.title ?? "");
	const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
	const [body, setBody] = useState(initialPost?.body ?? "");
	const [heroImageUrl, setHeroImageUrl] = useState(initialPost?.heroImageUrl ?? "");
	const [isPublished, setIsPublished] = useState(initialPost?.isPublished ?? true);
	const [savedSlug, setSavedSlug] = useState(initialPost?.slug ?? "");
	const [message, setMessage] = useState("");
	const [runningAction, setRunningAction] = useState<
		null | "draft" | "publish" | "unpublish" | "delete"
	>(null);

	const previewPost = useMemo<BlogPost>(
		() => ({
			id: initialPost?.id ?? "preview",
			slug: initialPost?.slug ?? "preview",
			title: title || "Untitled post",
			excerpt: excerpt || "Add an excerpt to see it here.",
			body: body || "Write your post body to preview it.",
			heroImageUrl: heroImageUrl || undefined,
			publishedAt: isPublished ? initialPost?.publishedAt ?? new Date().toISOString() : null,
			isPublished,
		}),
		[body, excerpt, heroImageUrl, initialPost, isPublished, title],
	);

	async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		const nextImage = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result ?? ""));
			reader.onerror = () => reject(new Error("Unable to read file"));
			reader.readAsDataURL(file);
		});

		setHeroImageUrl(nextImage);
	}

	async function savePost(nextPublished: boolean) {
		setRunningAction(nextPublished ? "publish" : "draft");
		setMessage("");

		const slug = savedSlug || initialPost?.slug || "";
		const endpoint =
			mode === "create" ? "/api/blog" : `/api/blog/${slug}`;
		const method = mode === "create" ? "POST" : "PATCH";

		try {
			const response = await fetch(endpoint, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title,
					excerpt,
					body,
					heroImageUrl: heroImageUrl || null,
					isPublished: nextPublished,
				}),
			});

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as
					| { error?: string }
					| null;
				throw new Error(errorPayload?.error || "Could not save post");
			}

			const payload = (await response.json()) as { post: BlogPost };
			setIsPublished(payload.post.isPublished);
			setSavedSlug(payload.post.slug);
			setMessage(
				nextPublished
					? "Post is published and live."
					: "Draft saved. You can keep editing and publish when ready.",
			);

			if (mode === "create") {
				router.replace(`/admin/blog/${payload.post.slug}/edit`);
			}

			router.refresh();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Could not save post.");
		} finally {
			setRunningAction(null);
		}
	}

	async function handleUnpublish() {
		setRunningAction("unpublish");
		setMessage("");
		const slug = savedSlug || initialPost?.slug || "";

		try {
			const response = await fetch(`/api/blog/${slug}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isPublished: false }),
			});

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as
					| { error?: string }
					| null;
				throw new Error(errorPayload?.error || "Could not unpublish post");
			}

			setIsPublished(false);
			setMessage("Post unpublished. It is no longer visible publicly.");
			router.refresh();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Could not unpublish post.");
		} finally {
			setRunningAction(null);
		}
	}

	async function handleDelete() {
		if (!savedSlug && !initialPost?.slug) {
			return;
		}

		const confirmed = window.confirm("Delete this post permanently?");
		if (!confirmed) {
			return;
		}

		setRunningAction("delete");
		setMessage("");
		const slug = savedSlug || initialPost?.slug || "";

		try {
			const response = await fetch(`/api/blog/${slug}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as
					| { error?: string }
					| null;
				throw new Error(errorPayload?.error || "Could not delete post");
			}

			router.push("/blog");
			router.refresh();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Could not delete post.");
		} finally {
			setRunningAction(null);
		}
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		await savePost(isPublished);
	}

	return (
		<div className="space-y-8">
			<form
				onSubmit={handleSubmit}
				className="space-y-6 rounded-2xl border border-[--color-border] bg-[--color-surface] p-6"
			>
				<div className="rounded-xl border border-[--color-border] bg-white/40 px-4 py-3 text-xs uppercase tracking-[0.14em] text-[--color-muted]">
					Status: {isPublished ? "Published" : "Draft"}
				</div>
				<div>
					<label className="block text-sm font-medium text-[--color-ink]">Title</label>
					<input
						required
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="mt-1 w-full rounded-xl border border-[--color-border] px-4 py-3"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-[--color-ink]">Excerpt</label>
					<textarea
						rows={3}
						value={excerpt}
						onChange={(e) => setExcerpt(e.target.value)}
						className="mt-1 w-full rounded-xl border border-[--color-border] px-4 py-3"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-[--color-ink]">Body</label>
					<textarea
						required
						rows={12}
						value={body}
						onChange={(e) => setBody(e.target.value)}
						className="mt-1 w-full rounded-xl border border-[--color-border] px-4 py-3 font-mono"
					/>
				</div>
				<div className="space-y-3">
					<label className="block text-sm font-medium text-[--color-ink]">Attach Hero Image</label>
					<input
						type="file"
						accept="image/*"
						onChange={handleFileChange}
						className="block w-full text-sm"
					/>
					<input
						type="url"
						placeholder="Or paste an image URL"
						value={heroImageUrl}
						onChange={(e) => setHeroImageUrl(e.target.value)}
						className="w-full rounded-xl border border-[--color-border] px-4 py-3"
					/>
				</div>
				<div className="flex flex-wrap gap-3">
					<button
						type="button"
						onClick={() => savePost(false)}
						disabled={runningAction !== null}
						className="rounded-full border border-[--color-border] px-5 py-2 text-sm text-[--color-ink] disabled:opacity-60"
					>
						{runningAction === "draft" ? "Saving Draft..." : "Save Draft"}
					</button>
					<button
						type="button"
						onClick={() => savePost(true)}
						disabled={runningAction !== null}
						className="rounded-full bg-[--color-accent] px-5 py-2 text-sm text-[--color-surface] disabled:opacity-60"
					>
						{runningAction === "publish"
							? "Publishing..."
							: isPublished
								? "Update Published"
								: "Publish"}
					</button>
					{mode === "edit" && isPublished ? (
						<button
							type="button"
							onClick={handleUnpublish}
							disabled={runningAction !== null}
							className="rounded-full border border-[--color-border] px-5 py-2 text-sm text-[--color-ink] disabled:opacity-60"
						>
							{runningAction === "unpublish" ? "Unpublishing..." : "Unpublish"}
						</button>
					) : null}
					{mode === "edit" ? (
						<button
							type="button"
							onClick={handleDelete}
							disabled={runningAction !== null}
							className="rounded-full border border-red-200 px-5 py-2 text-sm text-red-700 disabled:opacity-60"
						>
							{runningAction === "delete" ? "Deleting..." : "Delete"}
						</button>
					) : null}
					<button type="submit" className="sr-only">
						Submit
					</button>
				</div>
				{message ? <p className="text-sm text-[--color-muted]">{message}</p> : null}
				{isPublished && (savedSlug || initialPost?.slug) ? (
					<Link
						href={`/blog/${savedSlug || initialPost?.slug}`}
						target="_blank"
						className="inline-block text-sm text-[--color-accent] hover:underline"
					>
						View Live Post
					</Link>
				) : null}
			</form>

			<section className="space-y-3 rounded-2xl border border-[--color-border] bg-[--color-surface] p-6">
				<p className="text-xs uppercase tracking-[0.16em] text-[--color-muted]">
					Preview {previewPost.isPublished ? `(Published ${toIsoDateLabel(previewPost.publishedAt)})` : "(Draft)"}
				</p>
				<h2 className="font-serif text-3xl text-[--color-ink]">{previewPost.title}</h2>
				<p className="text-sm text-[--color-muted]">{previewPost.excerpt}</p>
				{previewPost.heroImageUrl ? (
					<div className="relative h-72 overflow-hidden rounded-2xl border border-[--color-border]">
						<Image
							src={previewPost.heroImageUrl}
							alt="Post preview"
							fill
							sizes="100vw"
							className="object-cover"
						/>
					</div>
				) : null}
				<article className="whitespace-pre-wrap text-sm leading-7 text-[--color-muted]">
					{previewPost.body}
				</article>
			</section>
		</div>
	);
}
