import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCmsSeedEntries, type CmsSeedEntry } from "@/lib/cms/cms-ts-seed";
import { cmsDocumentId, type CmsDocType } from "@/types/cms-content";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

export const CMS_IMPORT_TYPE_LABELS: Record<CmsDocType, string> = {
  legal: "Юридические",
  blog: "Блог",
  guide: "Путеводитель",
  destination: "Направления",
  place: "Места",
  author_article: "Статьи экспертов",
};

export type CmsImportTypeStats = {
  docType: CmsDocType;
  label: string;
  tsCount: number;
  cmsTotal: number;
  cmsPublished: number;
  cmsDraft: number;
  missingSlugs: string[];
  wouldCreate: number;
  wouldUpdate: number;
  wouldSkip: number;
};

export type CmsImportPreview = {
  locale: string;
  skipExisting: boolean;
  totalTs: number;
  byType: CmsImportTypeStats[];
  wouldCreate: number;
  wouldUpdate: number;
  wouldSkip: number;
};

function filterEntries(entries: CmsSeedEntry[], docTypes?: CmsDocType[]): CmsSeedEntry[] {
  if (!docTypes?.length) return entries;
  const allowed = new Set(docTypes);
  return entries.filter((entry) => allowed.has(entry.docType));
}

export function computeCmsImportPreview(
  entries: CmsSeedEntry[],
  existingIds: Map<string, { status: string }>,
  skipExisting: boolean
): CmsImportPreview {
  const byTypeMap = new Map<CmsDocType, CmsImportTypeStats>();

  function ensure(docType: CmsDocType): CmsImportTypeStats {
    const existing = byTypeMap.get(docType);
    if (existing) return existing;
    const stats: CmsImportTypeStats = {
      docType,
      label: CMS_IMPORT_TYPE_LABELS[docType],
      tsCount: 0,
      cmsTotal: 0,
      cmsPublished: 0,
      cmsDraft: 0,
      missingSlugs: [],
      wouldCreate: 0,
      wouldUpdate: 0,
      wouldSkip: 0,
    };
    byTypeMap.set(docType, stats);
    return stats;
  }

  for (const entry of entries) {
    const stats = ensure(entry.docType);
    stats.tsCount += 1;

    const id = cmsDocumentId(entry.docType, entry.slug, entry.locale);
    const existing = existingIds.get(id);

    if (!existing) {
      stats.missingSlugs.push(entry.slug);
      stats.wouldCreate += 1;
      continue;
    }

    stats.cmsTotal += 1;
    if (existing.status === "published") stats.cmsPublished += 1;
    else if (existing.status === "draft") stats.cmsDraft += 1;

    if (skipExisting) stats.wouldSkip += 1;
    else stats.wouldUpdate += 1;
  }

  const byType = [...byTypeMap.values()].filter((row) => row.tsCount > 0);

  return {
    locale: entries[0]?.locale ?? "ru",
    skipExisting,
    totalTs: entries.length,
    byType,
    wouldCreate: byType.reduce((sum, row) => sum + row.wouldCreate, 0),
    wouldUpdate: byType.reduce((sum, row) => sum + row.wouldUpdate, 0),
    wouldSkip: byType.reduce((sum, row) => sum + row.wouldSkip, 0),
  };
}

export async function fetchCmsImportPreview(
  supabase: DbClient,
  options: { docTypes?: CmsDocType[]; skipExisting?: boolean; locale?: string } = {}
): Promise<CmsImportPreview> {
  const locale = options.locale ?? "ru";
  const skipExisting = options.skipExisting ?? true;
  const entries = filterEntries(buildCmsSeedEntries(locale), options.docTypes);

  const docTypes = options.docTypes?.length
    ? options.docTypes
    : (Object.keys(CMS_IMPORT_TYPE_LABELS) as CmsDocType[]);

  const { data: cmsRows, error } = await supabase
    .from("content_documents")
    .select("id, doc_type, status")
    .eq("locale", locale)
    .in("doc_type", docTypes);

  if (error) {
    throw new Error(error.message);
  }

  const existingIds = new Map<string, { status: string }>();
  for (const row of cmsRows ?? []) {
    existingIds.set(row.id, { status: row.status });
  }

  return computeCmsImportPreview(entries, existingIds, skipExisting);
}
