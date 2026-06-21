import { BLOG_CONTENT_PLAN } from "@/data/blog-content-plan";
import { BUENOS_AIRES_EDITORIAL } from "./buenos-aires";
import { IGUAZU_EDITORIAL } from "./iguazu";
import { MONEY_EDITORIAL } from "./money";
import { NORTHWEST_EDITORIAL } from "./northwest";
import { PATAGONIA_EDITORIAL } from "./patagonia";
import type { EditorialOverride } from "./types";

export const EDITORIAL_OVERRIDES: Record<string, EditorialOverride> = {
  ...PATAGONIA_EDITORIAL,
  ...MONEY_EDITORIAL,
  ...BUENOS_AIRES_EDITORIAL,
  ...IGUAZU_EDITORIAL,
  ...NORTHWEST_EDITORIAL,
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
