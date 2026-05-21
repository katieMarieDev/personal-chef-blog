import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
	return (
		<main className="space-y-10">
			<section className="space-y-4">
				<p className="text-xs uppercase tracking-[0.16em] text-[--color-muted]">Contact</p>
				<h1 className="text-5xl text-[--color-ink] md:text-6xl">Plan Your Next Meal</h1>
				<p className="max-w-3xl text-base leading-8 text-[--color-muted]">
					Share what you are planning and I will follow up with availability, menu ideas, and next steps.
				</p>
			</section>

			<section className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
				<div className="rounded-3xl border border-dashed border-[--color-border] bg-[--color-surface] p-6 md:p-8">
					<h2 className="text-3xl text-[--color-ink]">Google Form Placeholder</h2>
					<p className="mt-3 text-sm leading-7 text-[--color-muted]">
						Google Form placeholder subtitle text that explains what the form is for and how to use it. This will be replaced by an embedded Google Form in the future.
					</p>
					<div className="mt-6 rounded-2xl border border-[--color-border] bg-white/70 p-5 text-sm text-[--color-muted]">
						<p className="font-medium text-[--color-ink]">Embed target:</p>
						<p className="mt-2">https://docs.google.com/forms/d/e/your-form-id/viewform?embedded=true</p>
					</div>
				</div>

				<ContactForm />
			</section>
		</main>
	);
}