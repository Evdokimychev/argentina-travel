import type { ImageRole } from "./types";

export interface PageImageSeoContext {
  pageTitle: string;
  category?: string;
  region?: string;
  keywords?: string[];
  role: ImageRole;
  sectionLabel?: string;
}

const ROLE_LABELS: Record<ImageRole, string> = {
  hero: "обложка",
  gallery: "фотография",
  content: "иллюстрация",
  section: "иллюстрация",
  card: "превью",
  background: "фон",
};

const REGION_LABELS: Record<string, string> = {
  patagonia: "Патагония",
  "buenos-aires": "Буэнос-Айрес",
  ba: "Буэнос-Айрес",
  bariloche: "Барилоче",
  mendoza: "Мендоса",
  salta: "Сальта",
  iguazu: "Игуасу",
  ushuaia: "Ушуая",
  calafate: "Эль-Калафате",
};

function normalizeRegion(region?: string): string | undefined {
  if (!region) return undefined;
  return REGION_LABELS[region] ?? region;
}

export function generateImageAlt(ctx: PageImageSeoContext): string {
  const region = normalizeRegion(ctx.region);
  const roleLabel = ROLE_LABELS[ctx.role];
  const section = ctx.sectionLabel ? ` — ${ctx.sectionLabel}` : "";

  if (region) {
    return `${ctx.pageTitle}${section}, ${region}: ${roleLabel} «Пора в Аргентину»`;
  }
  return `${ctx.pageTitle}${section}: ${roleLabel} «Пора в Аргентину»`;
}

export function generateImageTitle(ctx: PageImageSeoContext): string {
  const region = normalizeRegion(ctx.region);
  if (region) {
    return `${ctx.pageTitle} — ${region}`;
  }
  return ctx.pageTitle;
}

export function generateImageDescription(ctx: PageImageSeoContext): string {
  const region = normalizeRegion(ctx.region);
  const category = ctx.category ? ` (${ctx.category})` : "";
  const kw = ctx.keywords?.slice(0, 3).join(", ");
  const kwPart = kw ? `. Темы: ${kw}` : "";

  if (region) {
    return `Фотография для материала «${ctx.pageTitle}»${category} — регион ${region}${kwPart}. Проект «Пора в Аргентину».`;
  }
  return `Фотография для материала «${ctx.pageTitle}»${category}${kwPart}. Проект «Пора в Аргентину».`;
}
