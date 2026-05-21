import type { SessionLike } from "@/lib/auth0";

function getAllowedAdminEmails(): string[] {
	const raw = process.env.CHEF_ADMIN_EMAILS || process.env.CHEF_ADMIN_EMAIL || "";

	return raw
		.split(",")
		.map((value) => value.trim().toLowerCase())
		.filter(Boolean);
}

export function isAdmin(session: SessionLike): boolean {
	if (!session) {
		return false;
	}

	const admins = getAllowedAdminEmails();
	if (admins.length === 0) {
		// Backward-compatible fallback for local setup until admin emails are configured.
		return true;
	}

	const email = session.user?.email?.toLowerCase();
	if (!email) {
		return false;
	}

	return admins.includes(email);
}