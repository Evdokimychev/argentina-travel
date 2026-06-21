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

export type CmsLocaleCoverageRow = {
  localeCoverage: CmsLocaleCoverage;
};

export type CmsTranslationCoverageStat = {
  locale: I18nLocale;
  count: number;
  percent: number;
};

export type CmsTranslationCoverageByType = {
  docType: CmsDocType;
  label: string;
  total: number;
  locales: CmsTranslationCoverageStat[];
};

const DOC_TYPE_COVERAGE_LABELS: Record<CmsDocType, string> = {
  legal: "Юридические",
  blog: "Статьи",
  guide: "Путеводитель",
  destination: "Направления",
  place: "Места",
  author_article: "Статьи экспертов",
};

function countLocaleCoverage(
  rows: CmsLocaleCoverageRow[],
  locale: I18nLocale,
  mode: "published" | "any"
): number {
  if (locale === "ru") {
    return rows.length;
  }

  return rows.filter((row) => {
    const entry = row.localeCoverage[locale];
    if (!entry) return false;
    return mode === "published" ? entry.status === "published" : true;
  }).length;
}

/** Aggregate RU/ES/EN coverage (% published) per CMS doc type for admin dashboard. */
export function computeTranslationCoverageByType(
  groups: Array<{ docType: CmsDocType; rows: CmsLocaleCoverageRow[] }>,
  mode: "published" | "any" = "published"
): CmsTranslationCoverageByType[] {
  return groups.map(({ docType, rows }) => {
    const total = rows.length;
    const locales = I18N_LOCALES.map((locale) => {
      const count = countLocaleCoverage(rows, locale, mode);
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      return { locale, count, percent };
    });
    return {
      docType,
      label: DOC_TYPE_COVERAGE_LABELS[docType],
      total,
      locales,
    };
  });
}
