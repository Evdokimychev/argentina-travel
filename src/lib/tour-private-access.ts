import type { Tour } from "@/types/tour";

export function generatePrivateAccessToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  }
  return `pv${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function buildPrivateTourPath(slug: string, accessToken: string): string {
  return `/tours/${slug}?access=${encodeURIComponent(accessToken)}`;
}

export function buildPrivateTourHref(
  slug: string,
  accessToken: string,
  origin?: string
): string {
  const path = buildPrivateTourPath(slug, accessToken);
  return origin ? `${origin}${path}` : path;
}

export function isPrivatePublishedTour(tour: Pick<Tour, "isPrivate" | "status">): boolean {
  return Boolean(tour.isPrivate) && tour.status === "published";
}

export function isTourCatalogVisible(tour: Pick<Tour, "status" | "isPrivate">): boolean {
  return tour.status === "published" && !tour.isPrivate;
}

export function canAccessPrivateTour(
  tour: Pick<Tour, "isPrivate" | "status" | "privateAccessToken">,
  accessToken?: string | null
): boolean {
  if (!tour.isPrivate) return true;
  if (tour.status !== "published") return false;
  if (!accessToken?.trim() || !tour.privateAccessToken) return false;
  return accessToken.trim() === tour.privateAccessToken;
}

export function canViewTourDetail(
  tour: Pick<Tour, "status" | "isPrivate" | "privateAccessToken">,
  accessToken?: string | null
): boolean {
  if (tour.status !== "published") return false;
  if (isTourCatalogVisible(tour)) return true;
  return canAccessPrivateTour(tour, accessToken);
}
