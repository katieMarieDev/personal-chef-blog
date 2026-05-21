import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Chef Site",
	description: "Personal chef website",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}