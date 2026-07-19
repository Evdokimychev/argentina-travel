import { BLOG_CONTENT_PLAN } from "@/data/blog-content-plan";
import { BUENOS_AIRES_EDITORIAL } from "./buenos-aires";
import { IGUAZU_EDITORIAL } from "./iguazu";
import { MONEY_EDITORIAL } from "./money";
import { NORTHWEST_EDITORIAL } from "./northwest";
import { PATAGONIA_EDITORIAL } from "./patagonia";
import type { EditorialOverride } from "./types";

function quarantineLegacyOverrides(
  overrides: Record<string, EditorialOverride>,
  publicationBlockReason: string,
): Record<string, EditorialOverride> {
  return Object.fromEntries(
    Object.entries(overrides).map(([slug, override]) => [
      slug,
      override.publicationReady === true
        ? override
        : {
            ...override,
            publicationReady: false,
            publicationBlockReason: override.publicationBlockReason ?? publicationBlockReason,
          },
    ]),
  );
}

export const EDITORIAL_OVERRIDES: Record<string, EditorialOverride> = {
  ...quarantineLegacyOverrides(
    PATAGONIA_EDITORIAL,
    "Legacy override contains unverified dynamic price, schedule, seasonality, safety, or pseudo-source claims.",
  ),
  ...quarantineLegacyOverrides(
    MONEY_EDITORIAL,
    "Financial override contains unverified dynamic rates or prices and unsafe exchange or payment guidance.",
  ),
  ...quarantineLegacyOverrides(
    BUENOS_AIRES_EDITORIAL,
    "Legacy override contains unverified dynamic price, schedule, seasonality, or safety claims.",
  ),
  ...quarantineLegacyOverrides(
    IGUAZU_EDITORIAL,
    "Legacy override contains unverified admission, schedule, seasonality, or safety claims.",
  ),
  ...quarantineLegacyOverrides(
    NORTHWEST_EDITORIAL,
    "Legacy override contains unverified road, schedule, seasonality, or safety claims.",
  ),
};

export function getEditorialOverride(slug: string): EditorialOverride | undefined {
  return EDITORIAL_OVERRIDES[slug];
}

export function getEditorialProgress(): {
  planTotal: number;
  written: number;
  remaining: number;
  percent: number;
  byCategory: Record<string, number>;
} {
  const written = Object.keys(EDITORIAL_OVERRIDES).length;
  const planTotal = BLOG_CONTENT_PLAN.length;
  const byCategory: Record<string, number> = {
    patagonia: Object.keys(PATAGONIA_EDITORIAL).length,
    money: Object.keys(MONEY_EDITORIAL).length,
    "buenos-aires": Object.keys(BUENOS_AIRES_EDITORIAL).length,
    iguazu: Object.keys(IGUAZU_EDITORIAL).length,
    northwest: Object.keys(NORTHWEST_EDITORIAL).length,
  };
  return {
    planTotal,
    written,
    remaining: planTotal - written,
    percent: planTotal ? Math.round((written / planTotal) * 100) : 0,
    byCategory,
  };
}

export type { EditorialOverride } from "./types";
