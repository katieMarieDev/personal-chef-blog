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
				<div className="flex items-center gap-2 text-sm">
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
			</div>
		</header>
	);
}