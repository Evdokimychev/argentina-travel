import "server-only";

import { getPagesBySection } from "@/lib/content-pages";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import type {
  ContentFreshnessDocType,
  ContentFreshnessItem,
  ContentFreshnessRow,
  ContentFreshnessStatus,
  ImmigrationFreshnessState,
} from "@/types/content-freshness";

export const CONTENT_FRESHNESS_STALE_DAYS = 90;
export const CONTENT_FRESHNESS_CRITICAL_DAYS = 180;

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_OWNER = "Редакция контента";

type FreshnessSourceDoc = {
  docSlug: string;
  docType: ContentFreshnessDocType;
  title: string;
  href: string;
  updatedAt: string;
  owner: string;
};

function buildFreshnessSources(): FreshnessSourceDoc[] {
  return getPagesBySection("immigration").map((page) => ({
    docSlug: page.slug,
    docType: "guide",
    title: page.title,
    href: `/immigration/${page.slug}`,
    updatedAt: page.updatedAt,
    owner: DEFAULT_OWNER,
  }));
}

function parseIso(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeDateToIso(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00.000Z`;
  }
  const parsed = parseIso(value);
  if (parsed) return parsed.toISOString();
  return new Date().toISOString();
}

function addDaysIso(iso: string, days: number): string {
  const base = parseIso(iso) ?? new Date();
  return new Date(base.getTime() + days * DAY_MS).toISOString();
}

function computeAgeDays(lastVerifiedAt: string): number {
  const verified = parseIso(lastVerifiedAt);
  if (!verified) return 0;
  const diff = Date.now() - verified.getTime();
  return Math.max(0, Math.floor(diff / DAY_MS));
}

function resolveStatus(ageDays: number): ContentFreshnessStatus {
  if (ageDays > CONTENT_FRESHNESS_CRITICAL_DAYS) return "critical";
  if (ageDays > CONTENT_FRESHNESS_STALE_DAYS) return "stale";
  return "fresh";
}

function buildItem(source: FreshnessSourceDoc, row?: ContentFreshnessRow): ContentFreshnessItem {
  const lastVerifiedAt = normalizeDateToIso(row?.last_verified_at ?? source.updatedAt);
  const nextReviewAt = normalizeDateToIso(
    row?.next_review_at ?? addDaysIso(lastVerifiedAt, CONTENT_FRESHNESS_STALE_DAYS)
  );
  const ageDays = computeAgeDays(lastVerifiedAt);

  return {
    docSlug: source.docSlug,
    docType: source.docType,
    title: source.title,
    href: source.href,
    owner: row?.owner?.trim() || source.owner,
    lastVerifiedAt,
    nextReviewAt,
    ageDays,
    status: resolveStatus(ageDays),
  };
}

async function tryFetchRows(
  sources: FreshnessSourceDoc[],
  seedMissing: boolean
): Promise<Map<string, ContentFreshnessRow>> {
  if (sources.length === 0) return new Map();

  let supabase: ReturnType<typeof createSupabaseAdminClient> | null = null;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return new Map();
  }

  if (seedMissing) {
    const seedRows: Database["public"]["Tables"]["content_freshness"]["Insert"][] = sources.map((source) => {
      const lastVerifiedAt = normalizeDateToIso(source.updatedAt);
      return {
        doc_slug: source.docSlug,
        doc_type: source.docType,
        last_verified_at: lastVerifiedAt,
        next_review_at: addDaysIso(lastVerifiedAt, CONTENT_FRESHNESS_STALE_DAYS),
        owner: source.owner,
      };
    });

    await supabase
      .from("content_freshness")
      .upsert(seedRows, { onConflict: "doc_slug,doc_type", ignoreDuplicates: true });
  }

  const slugs = [...new Set(sources.map((source) => source.docSlug))];
  const docTypes = [...new Set(sources.map((source) => source.docType))];
  const { data } = await supabase
    .from("content_freshness")
    .select("id, doc_slug, doc_type, last_verified_at, next_review_at, owner, created_at, updated_at")
    .in("doc_slug", slugs)
    .in("doc_type", docTypes);

  const rows = new Map<string, ContentFreshnessRow>();
  for (const row of data ?? []) {
    rows.set(`${row.doc_type}:${row.doc_slug}`, row as ContentFreshnessRow);
  }

  return rows;
}

export function listContentFreshnessDocTypes(): ContentFreshnessDocType[] {
  const set = new Set(buildFreshnessSources().map((source) => source.docType));
  return [...set].sort();
}

export async function listContentFreshnessItems(options?: {
  docType?: ContentFreshnessDocType;
  staleOnly?: boolean;
  seedMissing?: boolean;
}): Promise<ContentFreshnessItem[]> {
  const sources = buildFreshnessSources().filter((source) =>
    options?.docType ? source.docType === options.docType : true
  );

  const rowMap = await tryFetchRows(sources, options?.seedMissing ?? false);
  const items = sources
    .map((source) => buildItem(source, rowMap.get(`${source.docType}:${source.docSlug}`)))
    .filter((item) => (options?.staleOnly ? item.status !== "fresh" : true))
    .sort((a, b) => b.ageDays - a.ageDays || a.title.localeCompare(b.title, "ru"));

  return items;
}

export async function getImmigrationFreshnessState(
  slug: string,
  fallbackUpdatedAt: string
): Promise<ImmigrationFreshnessState> {
  const sources = buildFreshnessSources();
  const source = sources.find((item) => item.docSlug === slug) ?? {
    docSlug: slug,
    docType: "guide" as const,
    title: slug,
    href: `/immigration/${slug}`,
    updatedAt: fallbackUpdatedAt,
    owner: DEFAULT_OWNER,
  };

  const rowMap = await tryFetchRows([source], true);
  const item = buildItem(source, rowMap.get(`${source.docType}:${source.docSlug}`));

  return {
    status: item.status,
    lastVerifiedAt: item.lastVerifiedAt,
    nextReviewAt: item.nextReviewAt,
    ageDays: item.ageDays,
  };
}
