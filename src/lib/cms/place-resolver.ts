import type { SupabaseClient } from "@supabase/supabase-js";
import { rowToCmsDocument } from "@/lib/cms/content-mapper";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  fetchPlaceBySlugServer,
  fetchPlaceSlugsServer,
  fetchPlacesServer,
} from "@/lib/places-repository";
import type { Database } from "@/types/database";
import type { PlaceDetail, PlaceListing } from "@/types/place";
import {
  cmsDocumentId,
  placeDetailFromCms,
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

function placeListingFromCms(doc: CmsDocument, fallback?: PlaceListing): PlaceListing | null {
  if (doc.body.kind !== "place") return null;
  const shortDescription = doc.body.shortDescription || fallback?.shortDescription || "";

  return {
    id: fallback?.id ?? `cms-place-${doc.slug}`,
    slug: doc.slug,
    name: doc.title,
    shortDescription,
    category: fallback?.category ?? "city",
    region: fallback?.region ?? "Аргентина",
    province: fallback?.province,
    city: fallback?.city,
    latitude: fallback?.latitude ?? -34.6037,
    longitude: fallback?.longitude ?? -58.3816,
    coverImage: fallback?.coverImage,
    tags: fallback?.tags ?? [],
    rating: fallback?.rating,
    visitDuration: fallback?.visitDuration,
    season: fallback?.season,
    ticketPrice: fallback?.ticketPrice,
    popularity: fallback?.popularity ?? 50,
  };
}

export async function fetchPublishedPlaceOverride(
  supabase: DbClient,
  slug: string,
  locale = "ru"
): Promise<CmsDocument | null> {
  const id = cmsDocumentId("place", slug, locale);
  const { data, error } = await supabase
    .from("content_documents")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return rowToCmsDocument(data);
}

async function fetchPublishedPlacesFromCmsWithClient(
  supabase: DbClient,
  locale = "ru"
): Promise<CmsDocument[]> {
  const { data, error } = await supabase
    .from("content_documents")
    .select("*")
    .eq("doc_type", "place")
    .eq("locale", locale)
    .eq("status", "published");

  if (error || !data) return [];
  return data.map(rowToCmsDocument).filter((doc) => doc.body.kind === "place");
}

export async function fetchPublishedPlacesFromCms(locale = "ru"): Promise<CmsDocument[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];
  return fetchPublishedPlacesFromCmsWithClient(supabase, locale);
}

/** CMS places override source catalog by slug and can add CMS-only slugs. */
export function mergePlaceCatalog(filePlaces: PlaceListing[], cmsPlaces: CmsDocument[]): PlaceListing[] {
  const mergedBySlug = new Map(filePlaces.map((item) => [item.slug, item] as const));
  const sourceOrder = filePlaces.map((item) => item.slug);
  const sourceSet = new Set(sourceOrder);

  for (const cmsDoc of cmsPlaces) {
    const fallback = mergedBySlug.get(cmsDoc.slug);
    const merged = placeListingFromCms(cmsDoc, fallback);
    if (merged) mergedBySlug.set(merged.slug, merged);
  }

  const ordered = sourceOrder
    .map((slug) => mergedBySlug.get(slug))
    .filter((item): item is PlaceListing => Boolean(item));
  const cmsOnly = [...mergedBySlug.values()]
    .filter((item) => !sourceSet.has(item.slug))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return [...ordered, ...cmsOnly];
}

export async function resolvePlaceCatalog(locale = "ru"): Promise<PlaceListing[]> {
  const fallback = await fetchPlacesServer();
  const supabase = await getServerClient();
  if (!supabase) return fallback;

  const cmsPlaces = await fetchPublishedPlacesFromCmsWithClient(supabase, locale);
  if (cmsPlaces.length === 0) return fallback;

  return mergePlaceCatalog(fallback, cmsPlaces);
}

/** Published CMS override merged with source place data by slug. */
export async function resolvePlacePage(slug: string, locale = "ru"): Promise<PlaceDetail | null> {
  const fallback = await fetchPlaceBySlugServer(slug);
  const supabase = await getServerClient();
  if (!supabase) return fallback;

  const override = await fetchPublishedPlaceOverride(supabase, slug, locale);
  if (!override) return fallback;

  return placeDetailFromCms(override, fallback ?? undefined) ?? fallback;
}

export async function listPublishedPlaceSlugs(locale = "ru"): Promise<string[]> {
  const fallbackSlugs = await fetchPlaceSlugsServer();
  const supabase = await getServerClient();
  if (!supabase) return fallbackSlugs;

  const { data } = await supabase
    .from("content_documents")
    .select("slug")
    .eq("doc_type", "place")
    .eq("locale", locale)
    .eq("status", "published");

  const cmsSlugs = new Set((data ?? []).map((row) => row.slug));
  return Array.from(new Set([...fallbackSlugs, ...cmsSlugs]));
}

export function placeOverrideId(slug: string, locale = "ru"): string {
  return cmsDocumentId("place", slug, locale);
}
