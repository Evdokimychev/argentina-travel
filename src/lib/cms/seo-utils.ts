/** SEO helpers — UX aligned with @payloadcms/plugin-seo field indicators. */

export const SEO_TITLE_IDEAL_MIN = 30;
export const SEO_TITLE_IDEAL_MAX = 60;
export const SEO_DESCRIPTION_IDEAL_MIN = 70;
export const SEO_DESCRIPTION_IDEAL_MAX = 160;

export type SeoFieldStatus = "empty" | "short" | "good" | "long";

export function seoTitleStatus(value: string): SeoFieldStatus {
  const len = value.trim().length;
  if (len === 0) return "empty";
  if (len < SEO_TITLE_IDEAL_MIN) return "short";
  if (len > SEO_TITLE_IDEAL_MAX) return "long";
  return "good";
}

export function seoDescriptionStatus(value: string): SeoFieldStatus {
  const len = value.trim().length;
  if (len === 0) return "empty";
  if (len < SEO_DESCRIPTION_IDEAL_MIN) return "short";
  if (len > SEO_DESCRIPTION_IDEAL_MAX) return "long";
  return "good";
}

export function seoStatusLabel(status: SeoFieldStatus): string {
  switch (status) {
    case "empty":
      return "Пусто";
    case "short":
      return "Коротко";
    case "good":
      return "Хорошо";
    case "long":
      return "Длинно";
  }
}

export function seoStatusClassName(status: SeoFieldStatus): string {
  switch (status) {
    case "good":
      return "text-emerald-700 bg-emerald-50";
    case "short":
      return "text-amber-700 bg-amber-50";
    case "long":
      return "text-orange-700 bg-orange-50";
    default:
      return "text-slate bg-gray-100";
  }
}

export function buildDefaultSeoTitle(pageTitle: string, siteName = "Пора в Аргентину"): string {
  const trimmed = pageTitle.trim();
  if (!trimmed) return siteName;
  if (trimmed.includes(siteName)) return trimmed;
  return `${trimmed} | ${siteName}`;
}

export function buildDefaultSeoDescription(excerpt: string, fallbackTitle: string): string {
  const fromExcerpt = excerpt.trim();
  if (fromExcerpt.length >= SEO_DESCRIPTION_IDEAL_MIN) {
    return fromExcerpt.slice(0, SEO_DESCRIPTION_IDEAL_MAX);
  }
  const base = fromExcerpt || fallbackTitle.trim();
  if (!base) return "";
  return base.length > SEO_DESCRIPTION_IDEAL_MAX ? base.slice(0, SEO_DESCRIPTION_IDEAL_MAX) : base;
}
