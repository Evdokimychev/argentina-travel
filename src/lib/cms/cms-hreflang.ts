import type { Metadata } from "next";
import { I18N_LOCALES, type I18nLocale } from "@/lib/i18n/config";
import { addLocalePrefix } from "@/lib/i18n/locale-path";
import { absoluteUrl } from "@/lib/site-url";
import { resolvePublishedCmsLocaleSlugs } from "@/lib/cms/content-resolver";
import type { CmsDocType } from "@/types/cms-content";

/** Public URL segment per CMS doc type (matches app router paths). */
export const CMS_DOC_TYPE_PATH_SEGMENT: Record<CmsDocType, string> = {
  blog: "blog",
  guide: "guide",
  destination: "destinations",
  place: "places",
  legal: "legal",
};

/**
 * hreflang alternates for CMS-backed content pages.
 * Uses per-locale CMS slugs when published; falls back to defaultSlug for TS-only locales.
 */
export async function buildCmsContentHreflangAlternates(
  docType: CmsDocType,
  defaultSlug: string
): Promise<NonNullable<Metadata["alternates"]>> {
  const segment = CMS_DOC_TYPE_PATH_SEGMENT[docType];
  const localeSlugs = await resolvePublishedCmsLocaleSlugs(docType, defaultSlug);

  const languages: Record<string, string> = {};

  for (const locale of I18N_LOCALES) {
    const slug = localeSlugs[locale as I18nLocale] ?? defaultSlug;
    const path = `/${segment}/${slug}`;
    languages[locale] = absoluteUrl(
      locale === "ru" ? path : addLocalePrefix(path, locale as I18nLocale)
    );
  }

  languages["x-default"] = languages.ru;

  const canonicalSlug = localeSlugs.ru ?? defaultSlug;

  return {
    canonical: `/${segment}/${canonicalSlug}`,
    languages,
  };
}
