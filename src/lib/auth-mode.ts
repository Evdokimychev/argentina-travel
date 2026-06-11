import { isSupabaseAuthEnabled } from "@/lib/supabase/env";

export { isSupabaseAuthEnabled };

export function isSupabaseBookingsEnabled(): boolean {
  return isSupabaseAuthEnabled();
}
