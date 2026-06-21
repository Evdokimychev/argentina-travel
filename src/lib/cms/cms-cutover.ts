import { blogPosts } from "@/data/blog";
import type { DestinationPage } from "@/data/destination-pages";
import { sortBlogPostsByDate } from "@/lib/blog-utils";
import { getPagesBySection } from "@/lib/content-pages";
import { getAllDestinations } from "@/lib/destinations";
import { fetchPlaceSlugsServer } from "@/lib/places-repository";
import { normalizeSiteFeatures } from "@/lib/cms/site-globals/normalize";
import {
  fetchSiteFeatures,
  invalidateSiteGlobal,
} from "@/lib/site-settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BlogPost } from "@/types";
import type { ContentPage } from "@/types/content-page";
import type { Json } from "@/types/database";
import type { PlaceListing } from "@/types/place";
import {
  fetchPublishedCmsDocumentsMergedByLocaleChain,
  getCmsServerClient,
} from "@/lib/cms/content-resolver";
import { isCmsDocumentComplete } from "@/lib/cms/translation-status";
import {
  blogPostFromCms,
  destinationPageFromCms,
  guidePageFromCms,
  type CmsDocType,
  type CmsDocument,
} from "@/types/cms-content";
import { placeListingFromCmsDocument } from "@/lib/cms/place-listing-from-cms";

export type CmsCutoverFlags = {
  blog: boolean;
  guide: boolean;
  destination: boolean;
  place: boolean;
};

export type CmsCutoverLane = keyof CmsCutoverFlags;

export type CmsCutoverLaneStats = {
  tsCount: number;
  cmsPublished: number;
  cmsCompletePublished: number;
  coveragePercent: number;
  missingSlugs: string[];
  cutover: boolean;
  canEnable: boolean;
  ready: boolean;
};

export type CmsCutoverReadiness = Record<CmsCutoverLane, CmsCutoverLaneStats>;

export class CmsCutoverNotReadyError extends Error {
  constructor(
    readonly lane: CmsCutoverLane,
    readonly missingSlugs: string[]
  ) {
    super(
      `Cutover ${lane}: не хватает ${missingSlugs.length} опубликованных CMS-документов`
    );
    this.name = "CmsCutoverNotReadyError";
  }
}

export function evaluateCutoverLane(
  tsSlugs: string[],
  cmsCompleteSlugs: string[],
  cutoverEnabled: boolean
): CmsCutoverLaneStats {
  const cmsSet = new Set(cmsCompleteSlugs);
  const missingSlugs = tsSlugs.filter((slug) => !cmsSet.has(slug));
  const tsCount = tsSlugs.length;
  const cmsCompletePublished = cmsCompleteSlugs.length;
  const covered = tsCount - missingSlugs.length;
  const coveragePercent = tsCount === 0 ? 100 : Math.round((covered / tsCount) * 100);
  const canEnable = tsCount > 0 && missingSlugs.length === 0;

  return {
    tsCount,
    cmsPublished: cmsCompletePublished,
    cmsCompletePublished,
    coveragePercent,
    missingSlugs,
    cutover: cutoverEnabled,
    canEnable,
    ready: !cutoverEnabled || canEnable,
  };
}

export async function getCmsCutoverFlags(): Promise<CmsCutoverFlags> {
  const features = await fetchSiteFeatures();
  return {
    blog: features.cmsBlogCutover === true,
    guide: features.cmsGuideCutover === true,
    destination: features.cmsDestinationCutover === true,
    place: features.cmsPlaceCutover === true,
  };
}

export function blogPostsFromCmsDocuments(docs: CmsDocument[]): BlogPost[] {
  const posts: BlogPost[] = [];
  for (const doc of docs) {
    if (doc.body.kind !== "blog" || !isCmsDocumentComplete(doc)) continue;
    const post = blogPostFromCms(doc);
    if (post) posts.push(post);
  }
  return sortBlogPostsByDate(posts);
}

export function guidePagesFromCmsDocuments(
  docs: CmsDocument[],
  orderSlugs?: string[]
): ContentPage[] {
  const mergedBySlug = new Map<string, ContentPage>();

  for (const doc of docs) {
    if (doc.body.kind !== "guide" || !isCmsDocumentComplete(doc)) continue;
    const page = guidePageFromCms(doc);
    if (page) mergedBySlug.set(page.slug, page);
  }

  if (orderSlugs?.length) {
    const sourceSet = new Set(orderSlugs);
    const ordered = orderSlugs
      .map((slug) => mergedBySlug.get(slug))
      .filter((page): page is ContentPage => Boolean(page));
    const cmsOnly = [...mergedBySlug.values()]
      .filter((page) => !sourceSet.has(page.slug))
      .sort((a, b) => a.title.localeCompare(b.title, "ru"));
    return [...ordered, ...cmsOnly];
  }

  return [...mergedBySlug.values()].sort((a, b) => a.title.localeCompare(b.title, "ru"));
}

export function destinationsFromCmsDocuments(
  docs: CmsDocument[],
  orderSlugs?: string[]
): DestinationPage[] {
  const mergedBySlug = new Map<string, DestinationPage>();

  for (const doc of docs) {
    if (doc.body.kind !== "destination" || !isCmsDocumentComplete(doc)) continue;
    const page = destinationPageFromCms(doc);
    if (page) mergedBySlug.set(page.id, page);
  }

  if (orderSlugs?.length) {
    const sourceSet = new Set(orderSlugs);
    const ordered = orderSlugs
      .map((slug) => mergedBySlug.get(slug))
      .filter((page): page is DestinationPage => Boolean(page));
    const cmsOnly = [...mergedBySlug.values()]
      .filter((page) => !sourceSet.has(page.id))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
    return [...ordered, ...cmsOnly];
  }

  return [...mergedBySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

export function placeListingsFromCmsDocuments(
  docs: CmsDocument[],
  orderSlugs?: string[]
): PlaceListing[] {
  const mergedBySlug = new Map<string, PlaceListing>();

  for (const doc of docs) {
    if (doc.body.kind !== "place" || !isCmsDocumentComplete(doc)) continue;
    const listing = placeListingFromCmsDocument(doc);
    if (listing) mergedBySlug.set(listing.slug, listing);
  }

  if (orderSlugs?.length) {
    const sourceSet = new Set(orderSlugs);
    const ordered = orderSlugs
      .map((slug) => mergedBySlug.get(slug))
      .filter((item): item is PlaceListing => Boolean(item));
    const cmsOnly = [...mergedBySlug.values()]
      .filter((item) => !sourceSet.has(item.slug))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
    return [...ordered, ...cmsOnly];
  }

  return [...mergedBySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

type CutoverDocType = Extract<CmsDocType, "blog" | "guide" | "destination" | "place">;

async function fetchCompletePublishedSlugs(
  docType: CutoverDocType,
  locale = "ru"
): Promise<string[]> {
  const docs = await fetchPublishedCmsDocumentsForCutover(docType, locale);
  return docs.filter(isCmsDocumentComplete).map((doc) => doc.slug);
}

export async function fetchCmsCutoverReadiness(): Promise<CmsCutoverReadiness> {
  const flags = await getCmsCutoverFlags();
  const [blogCmsSlugs, guideCmsSlugs, destinationCmsSlugs, placeCmsSlugs, placeTsSlugs] =
    await Promise.all([
      fetchCompletePublishedSlugs("blog"),
      fetchCompletePublishedSlugs("guide"),
      fetchCompletePublishedSlugs("destination"),
      fetchCompletePublishedSlugs("place"),
      fetchPlaceSlugsServer(),
    ]);

  const blogTsSlugs = blogPosts.map((post) => post.slug);
  const guideTsSlugs = getPagesBySection("guide").map((page) => page.slug);
  const destinationTsSlugs = getAllDestinations().map((destination) => destination.id);

  return {
    blog: evaluateCutoverLane(blogTsSlugs, blogCmsSlugs, flags.blog),
    guide: evaluateCutoverLane(guideTsSlugs, guideCmsSlugs, flags.guide),
    destination: evaluateCutoverLane(destinationTsSlugs, destinationCmsSlugs, flags.destination),
    place: evaluateCutoverLane(placeTsSlugs, placeCmsSlugs, flags.place),
  };
}

export async function setCmsCutoverFlags(
  patch: Partial<CmsCutoverFlags>,
  actorId: string | null
): Promise<CmsCutoverReadiness> {
  const current = await fetchSiteFeatures();
  const next: CmsCutoverFlags = {
    blog: patch.blog ?? current.cmsBlogCutover === true,
    guide: patch.guide ?? current.cmsGuideCutover === true,
    destination: patch.destination ?? current.cmsDestinationCutover === true,
    place: patch.place ?? current.cmsPlaceCutover === true,
  };

  const readiness = await fetchCmsCutoverReadiness();

  for (const lane of Object.keys(next) as CmsCutoverLane[]) {
    if (next[lane] && !readiness[lane].canEnable) {
      throw new CmsCutoverNotReadyError(lane, readiness[lane].missingSlugs);
    }
  }

  const value = normalizeSiteFeatures({
    ...current,
    cmsBlogCutover: next.blog,
    cmsGuideCutover: next.guide,
    cmsDestinationCutover: next.destination,
    cmsPlaceCutover: next.place,
  });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "site.features",
      value: value as unknown as Json,
      updated_by: actorId,
    },
    { onConflict: "key" }
  );

  if (error) {
    throw new Error(error.message);
  }

  invalidateSiteGlobal("site.features");
  return fetchCmsCutoverReadiness();
}

export async function fetchPublishedCmsDocumentsForCutover(
  docType: CutoverDocType,
  locale = "ru"
): Promise<CmsDocument[]> {
  const supabase = await getCmsServerClient();
  if (!supabase) return [];
  return fetchPublishedCmsDocumentsMergedByLocaleChain(supabase, docType, locale);
}
