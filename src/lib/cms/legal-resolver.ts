import type { SupabaseClient } from "@supabase/supabase-js";
import { LEGAL_DOCUMENTS } from "@/data/legal-content";
import type { LegalDocument } from "@/data/legal-content";
import { rowToCmsDocument } from "@/lib/cms/content-mapper";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import {
  cmsDocumentId,
  legalDocumentFromCms,
  type CmsDocType,
  type CmsDocument,
} from "@/types/cms-content";

type DbClient = SupabaseClient<Database>;

async function getServerClient(): Promise<DbClient | null> {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

export async function fetchPublishedLegalOverride(
  supabase: DbClient,
  slug: string,
  locale = "ru"
): Promise<CmsDocument | null> {
  const id = cmsDocumentId("legal", slug, locale);
  const { data, error } = await supabase
    .from("content_documents")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return rowToCmsDocument(data);
}

/** Published DB override takes precedence over TS file. */
export async function resolveLegalDocument(slug: string, locale = "ru"): Promise<LegalDocument | null> {
  const fallback = LEGAL_DOCUMENTS[slug] ?? null;
  const supabase = await getServerClient();
  if (!supabase) return fallback;

  const override = await fetchPublishedLegalOverride(supabase, slug, locale);
  if (!override) return fallback;

  return legalDocumentFromCms(override) ?? fallback;
}

export async function listPublishedLegalSlugs(locale = "ru"): Promise<string[]> {
  const supabase = await getServerClient();
  if (!supabase) return Object.keys(LEGAL_DOCUMENTS);

  const { data } = await supabase
    .from("content_documents")
    .select("slug")
    .eq("doc_type", "legal")
    .eq("locale", locale)
    .eq("status", "published");

  const cmsSlugs = new Set((data ?? []).map((row) => row.slug));
  return Array.from(new Set([...Object.keys(LEGAL_DOCUMENTS), ...cmsSlugs]));
}

export async function fetchCmsOverrideMap(
  supabase: DbClient,
  docType?: CmsDocType
): Promise<Map<string, CmsDocument>> {
  let query = supabase.from("content_documents").select("*");
  if (docType) query = query.eq("doc_type", docType);

  const { data } = await query;
  const map = new Map<string, CmsDocument>();
  for (const row of data ?? []) {
    map.set(row.id, rowToCmsDocument(row));
  }
  return map;
}

export function legalOverrideId(slug: string, locale = "ru"): string {
  return cmsDocumentId("legal", slug, locale);
}
