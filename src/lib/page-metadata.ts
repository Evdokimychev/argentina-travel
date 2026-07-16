import type { Metadata } from "next";
import { absoluteUrl, resolvePublicUrl } from "@/lib/site-url";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const DEFAULT_SOCIAL_IMAGE_PATH = "/media/destinations/patagonia/cover.jpg";
export const SEO_TITLE_MAX_LENGTH = 70;
export const SEO_DESCRIPTION_MAX_LENGTH = 180;

function truncateMetadataText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;

  const candidate = normalized.slice(0, maxLength - 1);
  const wordBoundary = candidate.lastIndexOf(" ");
  const cutAt = wordBoundary >= Math.floor(maxLength * 0.6) ? wordBoundary : candidate.length;
  return `${candidate.slice(0, cutAt).replace(/[\s,;:—-]+$/u, "")}…`;
}

export function normalizeSeoTitle(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  const title =
    normalized.length < 15 ? `${normalized} | ${SITE_BRAND_NAME}` : normalized;
  return truncateMetadataText(title, SEO_TITLE_MAX_LENGTH);
}

export function normalizeSeoDescription(value: string): string {
  return truncateMetadataText(value, SEO_DESCRIPTION_MAX_LENGTH);
}

export function buildPublicPageMetadata({
  title,
  description,
  path,
  image,
  canonical,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  canonical?: string;
}): Metadata {
  const normalizedTitle = normalizeSeoTitle(title);
  const normalizedDescription = normalizeSeoDescription(description);
  const pageUrl = absoluteUrl(canonical ?? path);
  const imageUrl = resolvePublicUrl(image ?? DEFAULT_SOCIAL_IMAGE_PATH);

  return {
    // Absolute titles avoid the global brand suffix pushing descriptive titles
    // beyond the search-result limit. The brand remains in site-level metadata.
    title: { absolute: normalizedTitle },
    description: normalizedDescription,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: normalizedTitle,
      description: normalizedDescription,
      type: "website",
      url: pageUrl,
      images: [{ url: imageUrl, alt: normalizedTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: normalizedTitle,
      description: normalizedDescription,
      images: [imageUrl],
    },
  };
}
