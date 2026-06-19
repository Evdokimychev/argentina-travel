import { isSupabaseAuthEnabled } from "@/lib/supabase/env";

export { isSupabaseAuthEnabled };

export type ToursSourceMode = "supabase" | "hybrid";

export function getToursSourceMode(): ToursSourceMode {
  const configured = process.env.NEXT_PUBLIC_TOURS_SOURCE?.trim().toLowerCase();
  return configured === "hybrid" ? "hybrid" : "supabase";
}

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

export function shouldUseSupabaseToursAsSourceOfTruth(): boolean {
  return isSupabaseToursEnabled() && getToursSourceMode() === "supabase";
}

export function isSupabaseMessagingEnabled(): boolean {
  return isSupabaseAuthEnabled();
}

export function isSupabaseForumEnabled(): boolean {
  return isSupabaseAuthEnabled();
}
