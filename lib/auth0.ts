import { Auth0Client } from "@auth0/nextjs-auth0/server";

const appBaseUrl =
	process.env.APP_BASE_URL ||
	(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const auth0 = new Auth0Client({
	domain: process.env.CHEF_AUTH0_DOMAIN ?? process.env.AUTH0_DOMAIN,
	clientId: process.env.CHEF_AUTH0_CLIENT_ID ?? process.env.AUTH0_CLIENT_ID,
	clientSecret:
		process.env.CHEF_AUTH0_CLIENT_SECRET ?? process.env.AUTH0_CLIENT_SECRET,
	secret: process.env.CHEF_AUTH0_SECRET ?? process.env.AUTH0_SECRET,
	appBaseUrl,
	authorizationParameters: {
		scope: "openid profile email",
	},
});

export type SessionLike = Awaited<ReturnType<typeof auth0.getSession>>;