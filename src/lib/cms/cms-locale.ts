import { I18N_LOCALES, isI18nLocale, type I18nLocale } from "@/lib/i18n/config";
import type { CmsDocType, CmsDocument, CmsDocumentStatus } from "@/types/cms-content";
import { cmsDocumentId } from "@/types/cms-content";

export type CmsLocaleCoverage = Record<
  I18nLocale,
  { id: string; status: CmsDocumentStatus; title: string } | null
>;

export type CmsDocumentGroup = {
  docType: CmsDocType;
  slug: string;
  locales: CmsLocaleCoverage;
};

export function buildCmsLocaleCoverage(
  docType: CmsDocType,
  slug: string,
  cmsMap: Map<string, CmsDocument>
): CmsLocaleCoverage {
  const coverage = {} as CmsLocaleCoverage;
  for (const locale of I18N_LOCALES) {
    const doc = cmsMap.get(cmsDocumentId(docType, slug, locale));
    coverage[locale] = doc
      ? { id: doc.id, status: doc.status, title: doc.title }
      : null;
  }
  return coverage;
}

export function groupCmsDocuments(documents: CmsDocument[]): CmsDocumentGroup[] {
  const groups = new Map<string, CmsDocumentGroup>();

  for (const doc of documents) {
    const key = `${doc.docType}:${doc.slug}`;
    if (!groups.has(key)) {
      const locales = {} as CmsLocaleCoverage;
      for (const locale of I18N_LOCALES) locales[locale] = null;
      groups.set(key, { docType: doc.docType, slug: doc.slug, locales });
    }
    const group = groups.get(key)!;
    if (isI18nLocale(doc.locale)) {
      group.locales[doc.locale] = {
        id: doc.id,
        status: doc.status,
        title: doc.title,
      };
    }
  }

  return Array.from(groups.values()).sort((a, b) =>
    `${a.docType}:${a.slug}`.localeCompare(`${b.docType}:${b.slug}`, "ru")
  );
}

export const CMS_LOCALE_LABELS: Record<I18nLocale, string> = {
  ru: "RU",
  es: "ES",
  en: "EN",
};
