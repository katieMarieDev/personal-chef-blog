import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey =
	process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

export function getSupabaseServerClient() {
	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error("Supabase URL/anon key environment variables are not configured.");
	}

	return createClient(supabaseUrl, supabaseAnonKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
	});
}

export function getSupabaseAdminClient() {
	if (!supabaseUrl || !supabaseServiceKey) {
		throw new Error("Supabase service role key is not configured.");
	}

	return createClient(supabaseUrl, supabaseServiceKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
	});
}
