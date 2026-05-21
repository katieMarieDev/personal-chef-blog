import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin";
import { auth0 } from "@/lib/auth0";

export default async function AdminLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth0.getSession();

	if (!session) {
		redirect("/auth/login?returnTo=/admin");
	}

	if (!isAdmin(session)) {
		redirect("/");
	}

	return children;
}
