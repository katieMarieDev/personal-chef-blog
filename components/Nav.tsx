"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type NavProps = {
	isAdmin: boolean;
};

const links = [
	{ href: "/", label: "Home" },
	{ href: "/recipes", label: "Recipes" },
	{ href: "/blog", label: "Journal" },
	{ href: "/contact", label: "Contact" },
];

export default function Nav({ isAdmin }: NavProps) {
	const [isMobileOpen, setIsMobileOpen] = useState(false);

	function closeMobileMenu() {
		setIsMobileOpen(false);
	}

	return (
		<header className="sticky top-0 z-20 border-b border-[--color-border] bg-[--color-surface]/90 backdrop-blur">
			<div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-8">
				<Link href="/" className="flex items-center gap-3 text-[--color-ink]">
					<Image
						src="/logos/momma-made-it-logo.svg"
						alt="Momma Made It logo"
						width={44}
						height={44}
						className="rounded-full border border-[--color-border] bg-[--color-surface]"
					/>
					<span className="font-serif text-2xl font-semibold tracking-wide">Momma Made It</span>
				</Link>

				<nav className="hidden gap-6 text-sm uppercase tracking-[0.16em] md:flex">
					{links.map((link) => (
						<Link key={link.href} href={link.href} className="text-[--color-muted] transition hover:text-[--color-accent]">
							{link.label}
						</Link>
					))}
				</nav>

				<div className="hidden items-center gap-2 text-sm md:flex">
					{isAdmin ? (
						<>
							<Link href="/admin" className="rounded-full border border-[--color-border] px-4 py-2 text-[--color-ink]">
								Dashboard
							</Link>
							<a href="/auth/logout" className="rounded-full bg-[--color-ink] px-4 py-2 text-[--color-surface]">
								Logout
							</a>
						</>
					) : (
						<a href="/auth/login" className="rounded-full bg-[--color-accent] px-4 py-2 text-[--color-surface]">
							Admin Login
						</a>
					)}
				</div>

				<button
					type="button"
					onClick={() => setIsMobileOpen((current) => !current)}
					className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border-2 border-[--color-ink] bg-[--color-surface] px-3 text-[--color-ink] shadow-sm transition hover:bg-[--color-border] md:hidden"
					aria-label="Toggle navigation menu"
					aria-expanded={isMobileOpen}
				>
					<span className="sr-only">Menu</span>
					{isMobileOpen ? (
						<svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
							<path d="M6 6L18 18" />
							<path d="M18 6L6 18" />
						</svg>
					) : (
						<svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
							<path d="M4 7H20" />
							<path d="M4 12H20" />
							<path d="M4 17H20" />
						</svg>
					)}
					<span className="text-xs font-semibold uppercase tracking-[0.12em]">
						{isMobileOpen ? "Close" : "Menu"}
					</span>
				</button>
			</div>

			<div
				className={`overflow-hidden bg-[--color-surface] px-4 transition-all duration-300 ease-out md:hidden ${
					isMobileOpen
						? "max-h-[520px] border-t border-[--color-border] py-4 opacity-100"
						: "max-h-0 border-t-0 py-0 opacity-0"
				}`}
			>
				<div>
					<nav className="flex flex-col gap-3 text-sm uppercase tracking-[0.14em]">
						{links.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								onClick={closeMobileMenu}
								className="text-[--color-muted] transition hover:text-[--color-accent]"
							>
								{link.label}
							</Link>
						))}
					</nav>

					<div className="mt-4 flex flex-col gap-2 text-sm">
						{isAdmin ? (
							<>
								<Link
									href="/admin"
									onClick={closeMobileMenu}
									className="rounded-full border border-[--color-border] px-4 py-2 text-center text-[--color-ink]"
								>
									Dashboard
								</Link>
								<a href="/auth/logout" className="rounded-full bg-[--color-ink] px-4 py-2 text-center text-[--color-surface]">
									Logout
								</a>
							</>
						) : (
							<a href="/auth/login" className="rounded-full bg-[--color-accent] px-4 py-2 text-center text-[--color-surface]">
								Admin Login
							</a>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}