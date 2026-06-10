/**
 * Admin capabilities — architecture only (Phase E).
 * No admin UI in this phase; used by permissions and future Supabase RLS mapping.
 */
export type AdminCapability =
  | "moderate_tours"
  | "moderate_reviews"
  | "manage_users"
  | "view_analytics";

/** Future admin modules (route ids for Supabase-era admin panel). */
export type AdminModuleId = "moderation" | "reviews" | "users" | "analytics";

export const ADMIN_CAPABILITIES: Record<AdminModuleId, AdminCapability[]> = {
  moderation: ["moderate_tours"],
  reviews: ["moderate_reviews"],
  users: ["manage_users"],
  analytics: ["view_analytics"],
};
