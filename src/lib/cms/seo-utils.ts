/** SEO helpers — UX aligned with @payloadcms/plugin-seo field indicators. */

import type { CmsDocumentSeo, CmsDocumentStatus } from "@/types/cms-content";

export const SEO_TITLE_IDEAL_MIN = 30;
export const SEO_TITLE_IDEAL_MAX = 60;
export const SEO_DESCRIPTION_IDEAL_MIN = 70;
export const SEO_DESCRIPTION_IDEAL_MAX = 160;

export type SeoFieldStatus = "empty" | "short" | "good" | "long";

export type CmsSeoValidationResult =
  | { ok: true; seo: CmsDocumentSeo }
  | { ok: false; error: string };

const CANONICAL_HOSTNAME = "www.goargentina.ru";

function truncateAtWord(value: string, maxLength: number): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;

  const slice = normalized.slice(0, maxLength + 1);
  const lastSpace = slice.lastIndexOf(" ");
  const boundary = lastSpace >= Math.floor(maxLength * 0.65) ? lastSpace : maxLength;
  return slice.slice(0, boundary).trimEnd();
}

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
  if (!trimmed) return truncateAtWord(siteName, SEO_TITLE_IDEAL_MAX);
  if (trimmed.includes(siteName)) return truncateAtWord(trimmed, SEO_TITLE_IDEAL_MAX);

  const branded = `${trimmed} | ${siteName}`;
  if (branded.length <= SEO_TITLE_IDEAL_MAX) return branded;
  return truncateAtWord(trimmed, SEO_TITLE_IDEAL_MAX);
}

export function buildDefaultSeoDescription(excerpt: string, fallbackTitle: string): string {
  const fromExcerpt = excerpt.trim();
  if (fromExcerpt.length >= SEO_DESCRIPTION_IDEAL_MIN) {
    return truncateAtWord(fromExcerpt, SEO_DESCRIPTION_IDEAL_MAX);
  }
  const base = fromExcerpt || fallbackTitle.trim();
  if (!base) return "";
  return truncateAtWord(base, SEO_DESCRIPTION_IDEAL_MAX);
}

export function seoCanonicalError(value: string): string | null {
  const canonical = value.trim();
  if (!canonical) return null;

  if (canonical.startsWith("/") && !canonical.startsWith("//") && !canonical.includes("\\")) {
    try {
      const parsed = new URL(canonical, `https://${CANONICAL_HOSTNAME}`);
      if (!parsed.hash) return null;
    } catch {
      // Use the common error below.
    }
  } else {
    try {
      const parsed = new URL(canonical);
      if (
        parsed.protocol === "https:" &&
        parsed.hostname === CANONICAL_HOSTNAME &&
        !parsed.username &&
        !parsed.password &&
        !parsed.hash
      ) {
        return null;
      }
    } catch {
      // Use the common error below.
    }
  }

  return "Укажите путь от / или адрес https://www.goargentina.ru без #фрагмента";
}

export function seoImageError(value: string): string | null {
  const image = value.trim();
  if (!image) return null;
  if (image.startsWith("/") && !image.startsWith("//") && !image.includes("\\")) return null;
  if (/^(media|images)\//i.test(image) && !image.includes("\\")) return null;

  try {
    const parsed = new URL(image);
    if (parsed.protocol === "https:" && !parsed.username && !parsed.password) {
      return null;
    }
  } catch {
    // Use the common error below.
  }

  return "Используйте путь к медиатеке или полный адрес https:// без логина и пароля";
}

export function validateAndNormalizeCmsSeo(value: unknown): CmsSeoValidationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Некорректные SEO-настройки" };
  }

  const record = value as Record<string, unknown>;
  for (const key of ["title", "description", "image", "canonical"] as const) {
    if (record[key] !== undefined && typeof record[key] !== "string") {
      return { ok: false, error: `Поле ${key} должно быть строкой` };
    }
  }
  if (record.noIndex !== undefined && typeof record.noIndex !== "boolean") {
    return { ok: false, error: "Поле noIndex должно быть логическим значением" };
  }

  const canonical = typeof record.canonical === "string" ? record.canonical.trim() : "";
  const canonicalError = seoCanonicalError(canonical);
  if (canonicalError) return { ok: false, error: canonicalError };

  const image = typeof record.image === "string" ? record.image.trim() : "";
  const imageError = seoImageError(image);
  if (imageError) return { ok: false, error: imageError };

  return {
    ok: true,
    seo: {
      title: typeof record.title === "string" ? record.title.trim() || undefined : undefined,
      description:
        typeof record.description === "string" ? record.description.trim() || undefined : undefined,
      image: image || undefined,
      canonical: canonical || undefined,
      noIndex: record.noIndex === true ? true : undefined,
    },
  };
}

export function isCmsDocumentNoIndex(
  status: CmsDocumentStatus,
  explicitNoIndex?: boolean
): boolean {
  return status !== "published" || explicitNoIndex === true;
}
