import { absoluteUrl } from "@/lib/site-url";
import { getSiteBrandDomain, getSiteBrandUrl, SITE_BRAND_NAME } from "@/lib/site-brand";
import type { TourItineraryPdfMeta } from "@/lib/tour-itinerary-pdf/types";

export function buildTourItineraryPdfMeta(slug: string): TourItineraryPdfMeta {
  const generatedAt = new Date();
  const slugPart = slug.replace(/[^a-z0-9-]/gi, "").slice(0, 16).toUpperCase() || "TOUR";
  const timePart = generatedAt.getTime().toString(36).toUpperCase().slice(-6);

  return {
    documentId: `PA-${slugPart}-${timePart}`,
    generatedAt,
    tourUrl: absoluteUrl(`/tours/${slug}`),
    brandName: SITE_BRAND_NAME,
    brandDomain: getSiteBrandDomain(),
    brandUrl: getSiteBrandUrl(),
  };
}

export function formatTourPdfFilename(slug: string): string {
  const safeSlug = slug.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return `pora-v-argentinu-${safeSlug || "tour"}-programma.pdf`;
}

export function formatPdfGeneratedDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
