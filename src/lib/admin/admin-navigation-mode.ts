import type { AdminNavItem, AdminNavItemId } from "@/types/admin";

const SIMPLE_NAVIGATION_IDS = new Set<AdminNavItemId>([
  "dashboard",
  "operations-hub",
  "operations-leads",
  "operations-bookings",
  "operations-waitlist",
  "operations-email",
  "operations-payments",
  "marketplace-tours",
  "marketplace-mobility",
  "marketplace-organizers",
  "marketplace-moderation",
  "content-documents",
  "content-knowledge",
  "content-shop",
  "content-media",
  "users-list",
  "analytics-overview",
  "system-settings",
  "system-commercial-plans",
]);

function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The simple mode only changes navigation density. It never changes authorization
 * and keeps the currently opened tool visible so the owner cannot get lost.
 */
export function filterAdminNavForMode(
  items: readonly AdminNavItem[],
  simpleMode: boolean,
  pathname: string,
): AdminNavItem[] {
  if (!simpleMode) return [...items];
  return items.filter(
    (item) => SIMPLE_NAVIGATION_IDS.has(item.id) || matchesPath(pathname, item.href),
  );
}

export function isSimpleAdminNavItem(id: AdminNavItemId): boolean {
  return SIMPLE_NAVIGATION_IDS.has(id);
}
