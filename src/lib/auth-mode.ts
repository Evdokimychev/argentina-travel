import { isSupabaseAuthEnabled } from "@/lib/supabase/env";

export { isSupabaseAuthEnabled };

export function isSupabaseBookingsEnabled(): boolean {
  return isSupabaseAuthEnabled();
}

export function isSupabaseShopEnabled(): boolean {
  return isSupabaseAuthEnabled();
}

export function isSupabaseReviewsEnabled(): boolean {
  return isSupabaseAuthEnabled();
}

export function isSupabaseToursEnabled(): boolean {
  if (!isSupabaseAuthEnabled()) return false;
  return process.env.NEXT_PUBLIC_SUPABASE_TOURS !== "false";
}
