export { createSupabaseBrowserClient } from "@/lib/supabase/client";
export { createSupabaseServerClient } from "@/lib/supabase/server";
export { createSupabaseAdminClient } from "@/lib/supabase/admin";
export {
  getSupabasePublicEnv,
  isSupabaseConfigured,
  requireSupabasePublicEnv,
  type SupabasePublicEnv,
} from "@/lib/supabase/env";
