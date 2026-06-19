import { BLOG_CONTENT_PLAN } from "@/data/blog-content-plan";
import { PATAGONIA_EDITORIAL } from "./patagonia";
import type { EditorialOverride } from "./types";

export const EDITORIAL_OVERRIDES: Record<string, EditorialOverride> = {
  ...PATAGONIA_EDITORIAL,
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
