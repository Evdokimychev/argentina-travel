import { findRuUrlDecision } from "@/lib/seo/publication-registry";

/**
 * Client-safe indexability helpers for admin SEO coverage and sitemap guards.
 * Keep this module free of server-only imports so client components can reuse it.
 */

export const STABLE_TOUR_LANDING_PATHS = [
  "/tours/region/patagonia",
  "/tours/region/iguazu",
] as const;

/**
 * Conservative compatibility guard for public paths whose stable,
 * self-canonical response cannot be guaranteed for every sitemap request.
 */
export function isIndexableInternalPath(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  if (href.includes("?") || href.includes("#") || href.includes("\\")) return false;
  if (href.startsWith("/organizer") || href.startsWith("/profile")) return false;
  if (href === "/booking/find") return false;
  if (href.startsWith("/booking/pay") || href.startsWith("/booking/travelers")) return false;
  if (href === "/baza-znaniy/poisk") return false;

  // Partner city availability changes independently from our publication
  // catalog. City hubs stay discoverable through /excursions without being
  // asserted as permanently indexable here.
  if (href.startsWith("/excursions/city/")) return false;

  return findRuUrlDecision(href) === null;
}
