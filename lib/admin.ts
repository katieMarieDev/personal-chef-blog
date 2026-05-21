import type { SessionLike } from "@/lib/auth0";

export function isAdmin(session: SessionLike): boolean {
	return !!session;
}