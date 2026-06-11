import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { requireSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Server-only client for API routes and background jobs.
 * Uses service role when available; otherwise anon key (RLS must allow intended ops).
 */
export function createSupabaseAdminClient() {
  const { url } = requireSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();

  return createClient<Database>(url, serviceRoleKey ?? anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
