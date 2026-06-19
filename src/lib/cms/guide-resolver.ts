import type { SupabaseClient } from "@supabase/supabase-js";
import { getPagesBySection, getContentPage } from "@/lib/content-pages";
import { rowToCmsDocument } from "@/lib/cms/content-mapper";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import type { ContentPage } from "@/types/content-page";
import {
  cmsDocumentId,
  guidePageFromCms,
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

export async function fetchPublishedGuideOverride(
  supabase: DbClient,
  slug: string,
  locale = "ru"
): Promise<CmsDocument | null> {
  const id = cmsDocumentId("guide", slug, locale);
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
export async function resolveGuidePage(slug: string, locale = "ru"): Promise<ContentPage | null> {
  const fallback = getContentPage("guide", slug) ?? null;
  const supabase = await getServerClient();
  if (!supabase) return fallback;

  const override = await fetchPublishedGuideOverride(supabase, slug, locale);
  if (!override) return fallback;

  return guidePageFromCms(override, fallback ?? undefined) ?? fallback;
}

export async function listPublishedGuideSlugs(locale = "ru"): Promise<string[]> {
  const fallbackSlugs = getPagesBySection("guide").map((page) => page.slug);
  const supabase = await getServerClient();
  if (!supabase) return fallbackSlugs;

  const { data } = await supabase
    .from("content_documents")
    .select("slug")
    .eq("doc_type", "guide")
    .eq("locale", locale)
    .eq("status", "published");

  const cmsSlugs = new Set((data ?? []).map((row) => row.slug));
  return Array.from(new Set([...fallbackSlugs, ...cmsSlugs]));
}

export function guideOverrideId(slug: string, locale = "ru"): string {
  return cmsDocumentId("guide", slug, locale);
}
