import type { MetadataRoute } from "next";
import { blogPosts } from "@/data/blog";
import { resolveBlogCatalog } from "@/lib/cms/blog-resolver";
import { getCmsCutoverFlags } from "@/lib/cms/cms-cutover";
import { FLIGHT_POPULAR_ROUTES } from "@/data/flight-popular-routes";
import { marketplaceTours } from "@/data/marketplace-tours";
import { LEGAL_DOCUMENTS } from "@/data/legal-content";
import {
  SITE_FOOTER_CONTACTS,
  SITE_FOOTER_NAV,
} from "@/data/site-links";
import { SITE_NAV_SECTIONS } from "@/data/site-nav";
import { SEED_USERS } from "@/lib/auth-store";
import {
  contentPageHref,
  getAllContentPages,
  getPagesBySection,
} from "@/lib/content-pages";
import { listPublishedGuideSlugs } from "@/lib/cms/guide-resolver";
import { listPublishedLegalSlugs } from "@/lib/cms/legal-resolver";
import { getAllGuideTopics, guideTopicHref } from "@/lib/guide-topics";
import { GUIDE_ABOUT_ARGENTINA_PATH } from "@/data/guide-about-argentina";
import { listPublishedDestinationSlugs } from "@/lib/cms/destination-resolver";
import { listPublishedPlaceSlugs } from "@/lib/cms/place-resolver";
import { flattenSiteNavSections } from "@/lib/site-nav";
import { expandI18nSitemapPaths } from "@/lib/i18n/sitemap-locales";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";
import { getBlogSitemapPriority } from "@/lib/blog-sitemap-priority";
import { getAllBlogHubIds, blogHubPath } from "@/data/blog-hubs";
import { absoluteUrl } from "@/lib/site-url";
import type { BlogPost } from "@/types";

function isIndexableInternalPath(href: string): boolean {
  if (!href.startsWith("/")) return false;
  if (href.includes("?")) return false;
  if (href.startsWith("/organizer")) return false;
  if (href.startsWith("/profile")) return false;
  if (href.startsWith("/booking/pay")) return false;
  if (href.startsWith("/booking/travelers")) return false;
  return true;
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths)];
}

function toSitemapEntry(
  path: string,
  lastModified?: string | Date,
  priority?: number,
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(path),
    lastModified: lastModified ? new Date(lastModified) : new Date(),
    ...(priority !== undefined ? { priority } : {}),
  };
}

async function collectBlogSitemapCatalog(): Promise<BlogPost[]> {
  try {
    const catalog = await resolveBlogCatalog();
    if (catalog.length > 0) return catalog;
    const cutover = await getCmsCutoverFlags();
    return cutover.blog ? [] : blogPosts;
  } catch {
    const cutover = await getCmsCutoverFlags();
    return cutover.blog ? [] : blogPosts;
  }
}

export async function collectTourSitemapPaths(): Promise<string[]> {
  try {
    const { fetchCutoverPublishedTourSlugs } = await import("@/lib/tours-server-cutover");
    const slugs = await fetchCutoverPublishedTourSlugs();
    return uniquePaths(slugs.map((slug) => `/tours/${slug}`));
  } catch {
    return marketplaceTours.map((tour) => `/tours/${tour.slug}`);
  }
}

export async function collectExcursionSitemapPaths(): Promise<string[]> {
  const paths = ["/excursions"];

  try {
    const { fetchExcursionSlugsServer, fetchExcursionsServer } = await import(
      "@/lib/tripster/excursion-server"
    );
    const [{ cities }, slugs] = await Promise.all([
      fetchExcursionsServer({ pageSize: 1 }),
      fetchExcursionSlugsServer(),
    ]);

    for (const city of cities) {
      paths.push(`/excursions/city/${city.slug}`);
    }
    for (const slug of slugs) {
      paths.push(`/excursions/${slug}`);
    }

    const { fetchGuideIdsServer } = await import("@/lib/tripster/guide-server");
    const guideIds = await fetchGuideIdsServer();
    for (const guideId of guideIds) {
      paths.push(`/excursions/guide/${guideId}`);
    }
  } catch {
    // static /excursions only
  }

  return uniquePaths(paths);
}

export async function collectPlacesSitemapPaths(): Promise<string[]> {
  const paths = ["/places", "/collections", "/itineraries"];

  try {
    const { fetchCollectionsServer, fetchItinerariesServer } = await import("@/lib/places-repository");
    const [placeSlugs, collections, itineraries] = await Promise.all([
      listPublishedPlaceSlugs(),
      fetchCollectionsServer(),
      fetchItinerariesServer(),
    ]);

    for (const slug of placeSlugs) {
      paths.push(`/places/${slug}`);
    }
    for (const col of collections) {
      paths.push(`/collections/${col.slug}`);
    }
    for (const it of itineraries) {
      paths.push(`/itineraries/${it.slug}`);
    }
  } catch {
    // static index paths only
  }

  return uniquePaths(paths);
}

export async function collectSitemapPaths(options?: { blogCatalog?: BlogPost[] }): Promise<string[]> {
  const navPaths = flattenSiteNavSections(SITE_NAV_SECTIONS)
    .map((link) => link.href)
    .filter(isIndexableInternalPath);

  const footerPaths = [
    ...SITE_FOOTER_NAV.map((link) => link.href),
    ...SITE_FOOTER_CONTACTS.map((link) => link.href),
  ].filter(isIndexableInternalPath);

  const blogCatalog = options?.blogCatalog ?? (await collectBlogSitemapCatalog());
  const indexableBlogPosts = filterIndexableBlogPosts(blogCatalog);

  const [
    tourPaths,
    excursionPaths,
    placesPaths,
    guideSlugs,
    destinationSlugs,
    legalSlugs,
  ] = await Promise.all([
    collectTourSitemapPaths(),
    collectExcursionSitemapPaths(),
    collectPlacesSitemapPaths(),
    listPublishedGuideSlugs(),
    listPublishedDestinationSlugs(),
    listPublishedLegalSlugs(),
  ]);

  const blogPaths = [
    "/blog",
    ...getAllBlogHubIds().map((hubId) => blogHubPath(hubId)),
    ...indexableBlogPosts.map((post) => `/blog/${post.slug}`),
  ];
  const immigrationPaths = getPagesBySection("immigration").map((page) => contentPageHref(page));
  const guidePaths = guideSlugs.map((slug) => `/guide/${slug}`);
  const guideTopicPaths = getAllGuideTopics().map((topic) => guideTopicHref(topic.slug));
  const destinationPaths = destinationSlugs.map((slug) => `/destinations/${slug}`);
  const legalPaths = legalSlugs.map((slug) => `/legal/${slug}`);
  const flightRoutePaths = FLIGHT_POPULAR_ROUTES.map((route) => `/flights/${route.id}`);
  const organizerPaths = SEED_USERS.filter((user) => user.roles?.includes("organizer")).map(
    (user) => `/organizers/${user.id}`
  );

  return uniquePaths([
    ...navPaths,
    ...footerPaths,
    ...tourPaths,
    ...excursionPaths,
    ...placesPaths,
    ...blogPaths,
    ...immigrationPaths,
    ...guidePaths,
    ...guideTopicPaths,
    GUIDE_ABOUT_ARGENTINA_PATH,
    ...destinationPaths,
    ...legalPaths,
    ...flightRoutePaths,
    ...organizerPaths,
  ]);
}

export async function buildSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const contentUpdatedAt = new Map(
    getAllContentPages().map((page) => [contentPageHref(page), page.updatedAt])
  );
  const blogCatalog = await collectBlogSitemapCatalog();
  const blogUpdatedAt = new Map(blogCatalog.map((post) => [`/blog/${post.slug}`, post.date]));
  const blogPostsBySlug = new Map(blogCatalog.map((post) => [post.slug, post]));
  const legalUpdatedAt = new Map(
    Object.values(LEGAL_DOCUMENTS).map((doc) => [`/legal/${doc.slug}`, doc.updatedAt])
  );

  const paths = expandI18nSitemapPaths(await collectSitemapPaths({ blogCatalog }));

  return paths.map((path) => {
    const lastModified =
      contentUpdatedAt.get(path) ?? blogUpdatedAt.get(path) ?? legalUpdatedAt.get(path);
    const priority = getBlogSitemapPriority(path, blogPostsBySlug);
    return toSitemapEntry(path, lastModified, priority);
  });
}
