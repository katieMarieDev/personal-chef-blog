import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import Nav from "@/components/Nav";
import { isAdmin } from "@/lib/admin";
import { auth0 } from "@/lib/auth0";

import "./globals.css";

const headingFont = Cormorant_Garamond({
	subsets: ["latin"],
	variable: "--font-heading",
	weight: ["500", "700"],
});

const bodyFont = Manrope({
	subsets: ["latin"],
	variable: "--font-body",
	weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
	title: "Momma Made It",
	description: "Personal chef recipes, stories, and booking inquiries.",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth0.getSession();

	return (
		<html lang="en">
			<body className={`${headingFont.variable} ${bodyFont.variable}`}>
				<div className="page-aura" aria-hidden="true" />
				<Nav isAdmin={isAdmin(session)} />
				<div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-12">{children}</div>
			</body>
		</html>
	);
}