import { isSupabaseAuthEnabled } from "@/lib/supabase/env";

export { isSupabaseAuthEnabled };

export function isSupabaseBookingsEnabled(): boolean {
  return isSupabaseAuthEnabled();
}

export function isSupabaseShopEnabled(): boolean {
  return isSupabaseAuthEnabled();
}
