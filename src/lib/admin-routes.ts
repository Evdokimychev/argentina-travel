import type { AdminModuleId } from "@/types/admin";

/**
 * Future admin route map — no pages in Phase E.
 * Replace path strings when building /admin in a later phase.
 */
export const ADMIN_MODULE_ROUTES: Record<AdminModuleId, string> = {
  moderation: "/admin/moderation/tours",
  reviews: "/admin/moderation/reviews",
  users: "/admin/users",
  analytics: "/admin/analytics",
};

/** Placeholder for Supabase-backed admin navigation. */
export function getAdminModuleRoute(moduleId: AdminModuleId): string {
  return ADMIN_MODULE_ROUTES[moduleId];
}
