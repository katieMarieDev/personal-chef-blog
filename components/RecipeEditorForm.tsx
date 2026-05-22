"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Recipe } from "@/lib/types";

type RecipeEditorFormProps = {
	initialRecipe?: Recipe;
	mode: "create" | "edit";
};

export default function RecipeEditorForm({ initialRecipe, mode }: RecipeEditorFormProps) {
	const router = useRouter();
	const [title, setTitle] = useState(initialRecipe?.title ?? "");
	const [prepTime, setPrepTime] = useState(initialRecipe?.prepTime ?? "");
	const [cookTime, setCookTime] = useState(initialRecipe?.cookTime ?? "");
	const [servings, setServings] = useState(String(initialRecipe?.servings ?? ""));
	const [notes, setNotes] = useState(initialRecipe?.notes ?? "");
	const [tagsList, setTagsList] = useState<string[]>(initialRecipe?.tags ?? []);
	const [newTag, setNewTag] = useState("");
	const [addingTag, setAddingTag] = useState(false);
	const [steps, setSteps] = useState<string[]>(
		initialRecipe?.steps?.length ? initialRecipe.steps : [""],
	);
	const [ingredients, setIngredients] = useState(
		initialRecipe?.ingredients?.length
			? initialRecipe.ingredients.map((ing) => ({
					qty: ing.qty ?? "",
					unit: ing.unit ?? "",
					name: ing.name ?? "",
				}))
			: [{ qty: "", unit: "", name: "" }],
	);
	const [isPublic, setIsPublic] = useState(initialRecipe?.isPublic ?? false);
	const [message, setMessage] = useState("");
	const [runningAction, setRunningAction] = useState<
		null | "save-draft" | "publish" | "unpublish" | "delete"
	>(null);

	function commitNewTag() {
		const t = newTag.toLowerCase().trim();
		if (t && !tagsList.includes(t)) {
			setTagsList((prev) => [...prev, t]);
		}
		setNewTag("");
		setAddingTag(false);
	}

	function removeTag(tag: string) {
		setTagsList((prev) => prev.filter((t) => t !== tag));
	}

	async function saveRecipe(nextIsPublic: boolean) {
		if (!initialRecipe || mode !== "edit") {
			setMessage("Recipe editor is only available in edit mode.");
			return;
		}
		setRunningAction(nextIsPublic ? "publish" : isPublic ? "unpublish" : "save-draft");
		setMessage("");
		const cleanedSteps = steps.map((s) => s.trim()).filter(Boolean);
		const cleanedIngredients = ingredients
			.map((ing) => ({ qty: ing.qty.trim(), unit: ing.unit.trim(), name: ing.name.trim() }))
			.filter((ing) => ing.name.length > 0);
		try {
			const response = await fetch(`/api/recipes/${initialRecipe.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title,
					prepTime,
					cookTime,
					servings,
					notes,
					tags: tagsList,
					steps: cleanedSteps,
					ingredients: cleanedIngredients,
					isPublic: nextIsPublic,
				}),
			});
			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { error?: string } | null;
				throw new Error(payload?.error || "Failed to save recipe.");
			}
			setIsPublic(nextIsPublic);
			setMessage(nextIsPublic ? "Recipe published." : "Recipe saved as draft.");
			router.refresh();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "An error occurred.");
		} finally {
			setRunningAction(null);
		}
	}

	async function handleDelete() {
		if (!initialRecipe) return;
		if (isPublic) {
			setMessage("Unpublish this recipe before deleting it.");
			return;
		}
		setRunningAction("delete");
		setMessage("");
		try {
			const response = await fetch(`/api/recipes/${initialRecipe.id}`, { method: "DELETE" });
			if (!response.ok) throw new Error("Failed to delete recipe.");
			router.push("/admin");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "An error occurred.");
		} finally {
			setRunningAction(null);
		}
	}

	function updateIngredient(index: number, key: "qty" | "unit" | "name", value: string) {
		setIngredients((prev) =>
			prev.map((ing, i) => (i === index ? { ...ing, [key]: value } : ing)),
		);
	}
	function addIngredient() {
		setIngredients((prev) => [...prev, { qty: "", unit: "", name: "" }]);
	}
	function removeIngredient(index: number) {
		setIngredients((prev) => prev.filter((_, i) => i !== index));
	}
	function updateStep(index: number, value: string) {
		setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
	}
	function addStep() {
		setSteps((prev) => [...prev, ""]);
	}
	function removeStep(index: number) {
		setSteps((prev) => prev.filter((_, i) => i !== index));
	}
	function moveStep(index: number, direction: "up" | "down") {
		setSteps((prev) => {
			const next = [...prev];
			const swap = direction === "up" ? index - 1 : index + 1;
			if (swap < 0 || swap >= next.length) return next;
			[next[index], next[swap]] = [next[swap], next[index]];
			return next;
		});
	}

	const heroImageUrl = initialRecipe?.heroImageUrl;
	const source = initialRecipe?.source;

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				void saveRecipe(false);
			}}
		>
			{/* ── BACK ── */}
			<div style={{ marginBottom: "1.5rem" }}>
				<Link href="/admin" className="text-sm text-[--color-muted] hover:text-[--color-ink]">
					← Back to admin
				</Link>
			</div>

			{/* ── HERO ── */}
			{heroImageUrl && (
				<div
					style={{ position: "relative", height: "18rem", marginBottom: "2rem", overflow: "hidden", borderRadius: "1rem" }}
					className="border border-[--color-border]"
				>
					<Image src={heroImageUrl} alt={title} fill className="object-cover" sizes="100vw" />
				</div>
			)}

			{/* ── TITLE ── */}
			<div style={{ marginBottom: "2rem" }}>
				{source && (
					<p style={{ marginBottom: "0.5rem" }} className="text-xs uppercase tracking-[0.2em] text-[--color-muted]">
						{source}
					</p>
				)}
				<input
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					required
					placeholder="Recipe title"
					style={{ display: "block", width: "100%", background: "transparent", border: "none", borderBottom: "1px solid var(--color-border)", outline: "none", paddingBottom: "0.5rem" }}
					className="font-serif text-4xl leading-tight text-[--color-ink]"
				/>
			</div>

			{/* ── PREP / COOK / SERVES ── */}
			<div style={{ display: "flex", gap: "2rem", marginBottom: "1.5rem" }}>
				{[
					{ label: "Prep", value: prepTime, set: setPrepTime },
					{ label: "Cook", value: cookTime, set: setCookTime },
					{ label: "Serves", value: servings, set: setServings },
				].map(({ label, value, set }) => (
					<div key={label} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
						<span className="text-xs uppercase tracking-[0.16em] text-[--color-muted]">{label}</span>
						<input
							type="text"
							value={value}
							onChange={(e) => set(e.target.value)}
							style={{ width: "5rem", border: "none", borderBottom: "1px solid var(--color-border)", background: "transparent", outline: "none" }}
							className="text-sm text-[--color-ink]"
						/>
					</div>
				))}
			</div>

			{/* ── TAGS ── */}
			<div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem", alignItems: "center" }}>
				{tagsList.map((tag) => (
					<span
						key={tag}
						style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", borderRadius: "9999px", border: "1px solid var(--color-border)", padding: "0.25rem 0.75rem" }}
						className="text-sm text-[--color-ink]"
					>
						{tag}
						<button
							type="button"
							onClick={() => removeTag(tag)}
							className="text-[--color-muted] hover:text-[--color-ink]"
						>
							×
						</button>
					</span>
				))}
				{addingTag ? (
					<input
						type="text"
						value={newTag}
						onChange={(e) => setNewTag(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") { e.preventDefault(); commitNewTag(); }
							if (e.key === "Escape") { setNewTag(""); setAddingTag(false); }
						}}
						onBlur={commitNewTag}
						autoFocus
						placeholder="new tag"
						style={{ border: "1px solid var(--color-border)", borderRadius: "9999px", background: "transparent", padding: "0.25rem 0.75rem", outline: "none", width: "6rem" }}
						className="text-sm"
					/>
				) : (
					<button
						type="button"
						onClick={() => setAddingTag(true)}
						style={{ border: "1px dashed var(--color-border)", borderRadius: "9999px", background: "transparent", padding: "0.25rem 0.75rem" }}
						className="text-sm text-[--color-muted]"
					>
						+ add tag
					</button>
				)}
			</div>

			{/* ── ACTION BUTTONS ── */}
			<div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2.5rem" }}>
				<button
					type="submit"
					disabled={runningAction !== null}
					style={{ borderRadius: "9999px", border: "1px solid var(--color-border)", padding: "0.5rem 1rem", background: "transparent", cursor: "pointer" }}
					className="text-sm text-[--color-ink] disabled:opacity-50"
				>
					{runningAction === "save-draft" ? "Saving..." : "Save draft"}
				</button>
				{!isPublic ? (
					<button
						type="button"
						onClick={() => void saveRecipe(true)}
						disabled={runningAction !== null}
						style={{ borderRadius: "9999px", border: "1px solid var(--color-ink)", padding: "0.5rem 1rem", background: "transparent", cursor: "pointer" }}
						className="text-sm font-medium text-[--color-ink] disabled:opacity-50"
					>
						{runningAction === "publish" ? "Publishing..." : "Publish"}
					</button>
				) : (
					<button
						type="button"
						onClick={() => void saveRecipe(false)}
						disabled={runningAction !== null}
						style={{ borderRadius: "9999px", border: "1px solid var(--color-border)", padding: "0.5rem 1rem", background: "transparent", cursor: "pointer" }}
						className="text-sm text-[--color-ink] disabled:opacity-50"
					>
						{runningAction === "unpublish" ? "Unpublishing..." : "Unpublish"}
					</button>
				)}
				<button
					type="button"
					onClick={handleDelete}
					disabled={runningAction === "delete"}
					style={{ borderRadius: "9999px", border: "1px solid #c0392b", padding: "0.5rem 1rem", background: "transparent", cursor: "pointer", color: "#c0392b" }}
					className="text-sm disabled:opacity-50"
				>
					{runningAction === "delete" ? "Deleting..." : "Delete"}
				</button>
			</div>

			{/* ── INGREDIENTS ── */}
			<div style={{ marginBottom: "2.5rem" }}>
				<h3 style={{ marginBottom: "0.75rem" }} className="text-xs uppercase tracking-[0.2em] text-[--color-muted]">
					Ingredients
				</h3>
				{/* Header row */}
				<div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }} className="text-xs uppercase tracking-[0.12em] text-[--color-muted]">
					<span style={{ width: "3.5rem", flexShrink: 0 }}>Qty</span>
					<span style={{ width: "5rem", flexShrink: 0 }}>Unit</span>
					<span style={{ flex: 1 }}>Name</span>
				</div>
				{ingredients.map((ing, index) => (
					<div key={index} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "center" }}>
						<input
							type="text"
							value={ing.qty}
							onChange={(e) => updateIngredient(index, "qty", e.target.value)}
							placeholder="1"
							style={{ width: "3.5rem", flexShrink: 0, border: "1px solid var(--color-border)", borderRadius: "0.25rem", background: "transparent", padding: "0.375rem 0.5rem", minWidth: 0 }}
							className="text-sm text-[--color-ink]"
						/>
						<input
							type="text"
							value={ing.unit}
							onChange={(e) => updateIngredient(index, "unit", e.target.value)}
							placeholder="cup"
							style={{ width: "5rem", flexShrink: 0, border: "1px solid var(--color-border)", borderRadius: "0.25rem", background: "transparent", padding: "0.375rem 0.5rem", minWidth: 0 }}
							className="text-sm text-[--color-ink]"
						/>
						<input
							type="text"
							value={ing.name}
							onChange={(e) => updateIngredient(index, "name", e.target.value)}
							placeholder="ingredient"
							style={{ flex: 1, border: "1px solid var(--color-border)", borderRadius: "0.25rem", background: "transparent", padding: "0.375rem 0.5rem", minWidth: 0 }}
							className="text-sm text-[--color-ink]"
						/>
						<button
							type="button"
							onClick={() => removeIngredient(index)}
							disabled={ingredients.length === 1}
							style={{ flexShrink: 0 }}
							className="text-[--color-muted] disabled:opacity-30"
						>
							×
						</button>
					</div>
				))}
				<button
					type="button"
					onClick={addIngredient}
					style={{ marginTop: "0.25rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}
					className="text-sm text-[--color-muted]"
				>
					+ Add ingredient
				</button>
			</div>

			{/* ── STEPS ── */}
			<div style={{ marginBottom: "2.5rem" }}>
				<h3 style={{ marginBottom: "0.75rem" }} className="text-xs uppercase tracking-[0.2em] text-[--color-muted]">
					Steps
				</h3>
				{steps.map((step, index) => (
					<div key={index} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", alignItems: "flex-start" }}>
						<span
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: "1.5rem",
								height: "1.5rem",
								flexShrink: 0,
								borderRadius: "9999px",
								border: "1px solid var(--color-border)",
								marginTop: "0.5rem",
							}}
							className="text-xs text-[--color-muted]"
						>
							{index + 1}
						</span>
						<textarea
							value={step}
							onChange={(e) => updateStep(index, e.target.value)}
							rows={3}
							style={{ flex: 1, border: "1px solid var(--color-border)", borderRadius: "0.25rem", background: "transparent", padding: "0.5rem 0.75rem", resize: "none", minWidth: 0 }}
							className="text-sm leading-relaxed text-[--color-ink]"
						/>
						<div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flexShrink: 0, paddingTop: "0.5rem" }}>
							<button
								type="button"
								onClick={() => moveStep(index, "up")}
								disabled={index === 0}
								style={{ border: "1px solid var(--color-border)", borderRadius: "0.25rem", padding: "0.125rem 0.375rem", background: "transparent", cursor: "pointer" }}
								className="text-xs text-[--color-muted] disabled:opacity-20"
							>
								▲
							</button>
							<button
								type="button"
								onClick={() => moveStep(index, "down")}
								disabled={index === steps.length - 1}
								style={{ border: "1px solid var(--color-border)", borderRadius: "0.25rem", padding: "0.125rem 0.375rem", background: "transparent", cursor: "pointer" }}
								className="text-xs text-[--color-muted] disabled:opacity-20"
							>
								▼
							</button>
							<button
								type="button"
								onClick={() => removeStep(index)}
								disabled={steps.length === 1}
								style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
								className="text-sm text-[--color-muted] disabled:opacity-20"
							>
								×
							</button>
						</div>
					</div>
				))}
				<button
					type="button"
					onClick={addStep}
					style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
					className="text-sm text-[--color-muted]"
				>
					+ Add step
				</button>
			</div>

			{/* ── NOTES ── */}
			<div style={{ marginBottom: "2.5rem" }}>
				<h3 style={{ marginBottom: "0.75rem" }} className="text-xs uppercase tracking-[0.2em] text-[--color-muted]">
					Notes
				</h3>
				<textarea
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					rows={5}
					placeholder="Your notes — substitutions, memories, tweaks..."
					style={{ width: "100%", border: "1px solid var(--color-border)", borderRadius: "0.25rem", background: "transparent", padding: "0.75rem", resize: "none" }}
					className="text-sm leading-relaxed text-[--color-ink]"
				/>
				<div style={{ marginTop: "0.75rem" }}>
					<button
						type="button"
						onClick={() => void saveRecipe(isPublic)}
						disabled={runningAction !== null}
						style={{ borderRadius: "9999px", border: "1px solid var(--color-ink)", padding: "0.5rem 1rem", background: "transparent", cursor: "pointer" }}
						className="text-sm font-medium text-[--color-ink] disabled:opacity-50"
					>
						{runningAction !== null ? "Saving..." : "Save notes"}
					</button>
				</div>
			</div>

			{/* ── PHOTOS ── */}
			<div style={{ marginBottom: "2rem" }}>
				<h3 style={{ marginBottom: "0.75rem" }} className="text-xs uppercase tracking-[0.2em] text-[--color-muted]">
					Photos
				</h3>
				<div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
					{heroImageUrl && (
						<div style={{ position: "relative", width: "5rem", height: "5rem", overflow: "hidden", borderRadius: "0.5rem" }} className="border border-[--color-border]">
							<Image src={heroImageUrl} alt="Hero" fill className="object-cover" sizes="80px" />
						</div>
					)}
					<button
						type="button"
						style={{ width: "5rem", height: "5rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem", border: "1px dashed var(--color-border)", borderRadius: "0.5rem", background: "transparent", cursor: "pointer" }}
						className="text-[--color-muted]"
					>
						<span style={{ fontSize: "1.25rem", lineHeight: 1 }}>+</span>
						<span className="text-xs">Photo</span>
					</button>
				</div>
			</div>

			{message && (
				<p className="text-sm text-[--color-muted]">{message}</p>
			)}
		</form>
	);
}
