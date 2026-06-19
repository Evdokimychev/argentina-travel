import type { SupabaseClient } from "@supabase/supabase-js";
import { getAllDestinations, getDestinationBySlug } from "@/lib/destinations";
import { rowToCmsDocument } from "@/lib/cms/content-mapper";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import type { DestinationPage } from "@/data/destination-pages";
import {
  cmsDocumentId,
  destinationPageFromCms,
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

export async function fetchPublishedDestinationOverride(
  supabase: DbClient,
  slug: string,
  locale = "ru"
): Promise<CmsDocument | null> {
  const id = cmsDocumentId("destination", slug, locale);
  const { data, error } = await supabase
    .from("content_documents")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return rowToCmsDocument(data);
}

async function fetchPublishedDestinationsFromCmsWithClient(
  supabase: DbClient,
  locale = "ru"
): Promise<CmsDocument[]> {
  const { data, error } = await supabase
    .from("content_documents")
    .select("*")
    .eq("doc_type", "destination")
    .eq("locale", locale)
    .eq("status", "published");

  if (error || !data) return [];
  return data.map(rowToCmsDocument).filter((doc) => doc.body.kind === "destination");
}

export async function fetchPublishedDestinationsFromCms(locale = "ru"): Promise<CmsDocument[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];
  return fetchPublishedDestinationsFromCmsWithClient(supabase, locale);
}

/** CMS destinations override TS entries by slug and can add CMS-only slugs. */
export function mergeDestinationCatalog(
  fileDestinations: DestinationPage[],
  cmsDestinations: CmsDocument[]
): DestinationPage[] {
  const mergedBySlug = new Map(fileDestinations.map((item) => [item.id, item] as const));
  const sourceOrder = fileDestinations.map((item) => item.id);
  const sourceSet = new Set(sourceOrder);

  for (const cmsDoc of cmsDestinations) {
    if (cmsDoc.body.kind !== "destination") continue;
    const fallback = mergedBySlug.get(cmsDoc.slug);
    const merged = destinationPageFromCms(cmsDoc, fallback);
    if (merged) mergedBySlug.set(merged.id, merged);
  }

  const ordered = sourceOrder
    .map((slug) => mergedBySlug.get(slug))
    .filter((item): item is DestinationPage => Boolean(item));
  const cmsOnly = [...mergedBySlug.values()]
    .filter((item) => !sourceSet.has(item.id))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return [...ordered, ...cmsOnly];
}

export async function resolveDestinationCatalog(locale = "ru"): Promise<DestinationPage[]> {
  const fallback = getAllDestinations();
  const supabase = await getServerClient();
  if (!supabase) return fallback;

  const cmsDestinations = await fetchPublishedDestinationsFromCmsWithClient(supabase, locale);
  if (cmsDestinations.length === 0) return fallback;

  return mergeDestinationCatalog(fallback, cmsDestinations);
}

/** Published CMS override merged with TS defaults for media and metadata. */
export async function resolveDestinationPage(
  slug: string,
  locale = "ru"
): Promise<DestinationPage | null> {
  const fallback = getDestinationBySlug(slug) ?? null;
  const supabase = await getServerClient();
  if (!supabase) return fallback;

  const override = await fetchPublishedDestinationOverride(supabase, slug, locale);
  if (!override) return fallback;

  return destinationPageFromCms(override, fallback ?? undefined) ?? fallback;
}

export async function listPublishedDestinationSlugs(locale = "ru"): Promise<string[]> {
  const fallbackSlugs = getAllDestinations().map((destination) => destination.id);
  const supabase = await getServerClient();
  if (!supabase) return fallbackSlugs;

  const { data } = await supabase
    .from("content_documents")
    .select("slug")
    .eq("doc_type", "destination")
    .eq("locale", locale)
    .eq("status", "published");

  const cmsSlugs = new Set((data ?? []).map((row) => row.slug));
  return Array.from(new Set([...fallbackSlugs, ...cmsSlugs]));
}

export function destinationOverrideId(slug: string, locale = "ru"): string {
  return cmsDocumentId("destination", slug, locale);
}
