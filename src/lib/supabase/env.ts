export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

/** Public Supabase config — safe for client and RLS-protected server inserts. */
export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) return null;

  return { url, anonKey };
}

export function requireSupabasePublicEnv(): SupabasePublicEnv {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local."
    );
  }
  return env;
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicEnv() !== null;
}

/** Re-export for server/client — see auth-mode.ts for full logic. */
export function isSupabaseAuthEnabled(): boolean {
  if (!isSupabaseConfigured()) return false;
  return process.env.NEXT_PUBLIC_SUPABASE_AUTH !== "false";
}
