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
import { PUBLIC_ORGANIZERS } from "@/data/public-organizers";
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
import { buildBlogAuthorProfiles } from "@/lib/blog-authors";
import { YANDEX_PRIORITY_HUB_PATHS } from "@/lib/site-sections-json-ld";
import { absoluteUrl } from "@/lib/site-url";
import { fetchSiteControlPlaneEdge } from "@/lib/site-settings-edge";
import {
  isPublicPathIncludedInSitemap,
  isTravelModulePathEnabled,
} from "@/lib/public-module-visibility";
import { KB_SECTIONS } from "@/lib/knowledge-base/content";
import { listPublishedKnowledgeSlugs } from "@/lib/cms/knowledge-resolver";
import { entryHref, sectionHref } from "@/lib/knowledge-base/urls";
import { normalizeExcursionCitySlug } from "@/data/excursion-city-links";
import {
  filterRuSitemapPaths,
  findRuUrlDecision,
} from "@/lib/seo/publication-registry";
import type { BlogPost } from "@/types";
import type { SiteModulesGlobal, SiteNavigationGlobal } from "@/types/site-globals";

/**
 * Conservative compatibility guard for public paths whose stable,
 * self-canonical response cannot be guaranteed for every sitemap request.
 */
export function isIndexableInternalPath(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  if (href.includes("?") || href.includes("#") || href.includes("\\")) return false;
  if (href.startsWith("/organizer") || href.startsWith("/profile")) return false;
  if (href === "/booking/find") return false;
  if (href.startsWith("/booking/pay") || href.startsWith("/booking/travelers")) return false;
  if (href === "/baza-znaniy/poisk") return false;

  // Partner city availability changes independently from our publication
  // catalog. City hubs stay discoverable through /excursions without being
  // asserted as permanently indexable here.
  if (href.startsWith("/excursions/city/")) return false;

  return findRuUrlDecision(href) === null;
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
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
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

export const STABLE_TOUR_LANDING_PATHS = ["/tours/region/patagonia"] as const;

export async function collectTourSitemapPaths(): Promise<string[]> {
  try {
    const { fetchCutoverPublishedTourSlugs } = await import("@/lib/tours-server-cutover");
    const slugs = await fetchCutoverPublishedTourSlugs();
    return uniquePaths([...STABLE_TOUR_LANDING_PATHS, ...slugs.map((slug) => `/tours/${slug}`)]);
  } catch {
    return uniquePaths([
      ...STABLE_TOUR_LANDING_PATHS,
      ...marketplaceTours.map((tour) => `/tours/${tour.slug}`),
    ]);
  }
}

export async function collectExcursionSitemapPaths(): Promise<string[]> {
  const paths = ["/excursions"];

  try {
    const {
      fetchExcursionCityServer,
      fetchExcursionSlugsServer,
      fetchExcursionsServer,
    } = await import("@/lib/tripster/excursion-server");
    const [{ cities, items }, slugs] = await Promise.all([
      fetchExcursionsServer({ pageSize: 500 }),
      fetchExcursionSlugsServer(),
    ]);

    const citySlugsWithPublishedExcursions = new Set(
      items.map((item) => normalizeExcursionCitySlug(item.citySlug, item.cityName).toLowerCase()),
    );
    const indexableCities = await Promise.all(
      cities.map(async (city) => {
        if (findRuUrlDecision(`/excursions/city/${city.slug}`)) return null;
        if (!citySlugsWithPublishedExcursions.has(city.slug.toLowerCase())) return null;
        return (await fetchExcursionCityServer(city.slug)) ? city : null;
      }),
    );

    // Partners can expose the same city twice: once with a readable slug and
    // once with a technical `city-123` alias. Only the readable canonical page
    // belongs in sitemap, otherwise both pages compete for the same query.
    const uniqueIndexableCities = new Map<
      string,
      NonNullable<(typeof indexableCities)[number]>
    >();
    for (const city of indexableCities) {
      if (!city) continue;
      const identity = city.name.trim().toLocaleLowerCase("ru-RU");
      const current = uniqueIndexableCities.get(identity);
      const isReadableSlug = !/^city-\d+$/i.test(city.slug);
      const currentIsTechnical = current ? /^city-\d+$/i.test(current.slug) : false;
      if (!current || (currentIsTechnical && isReadableSlug)) {
        uniqueIndexableCities.set(identity, city);
      }
    }
    for (const city of uniqueIndexableCities.values()) {
      paths.push(`/excursions/city/${city.slug}`);
    }
    for (const slug of slugs) {
      paths.push(`/excursions/${slug}`);
    }

    // Partner guide IDs currently resolve inconsistently and previously added
    // stable 404s to sitemap. Re-enable only from a publication-aware detail source.
  } catch {
    // static /excursions only
  }

  return uniquePaths(paths);
}

export async function collectApartmentSitemapPaths(): Promise<string[]> {
  try {
    const { listPublishedApartments } = await import("@/lib/apartments/apartment-repository-server");
    const { PRIMARY_PUBLIC_MARKET } = await import("@/lib/market-context");
    const apartments = await listPublishedApartments(PRIMARY_PUBLIC_MARKET.id);
    return ["/apartments", ...apartments.map((item) => `/apartments/${item.slug}`)];
  } catch {
    return [];
  }
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

export async function collectKnowledgeBaseSitemapPaths(): Promise<string[]> {
  try {
    const paths = ["/baza-znaniy"];
    for (const section of KB_SECTIONS) {
      paths.push(sectionHref(section.slug));
    }
    for (const id of await listPublishedKnowledgeSlugs()) {
      paths.push(entryHref(id));
    }
    return uniquePaths(paths);
  } catch {
    return ["/baza-znaniy"];
  }
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
    apartmentPaths,
    guideSlugs,
    destinationSlugs,
    legalSlugs,
    kbPaths,
  ] = await Promise.all([
    collectTourSitemapPaths(),
    collectExcursionSitemapPaths(),
    collectPlacesSitemapPaths(),
    collectApartmentSitemapPaths(),
    listPublishedGuideSlugs(),
    listPublishedDestinationSlugs(),
    listPublishedLegalSlugs(),
    collectKnowledgeBaseSitemapPaths(),
  ]);

  const blogPaths = [
    "/blog",
    "/blog/authors",
    ...buildBlogAuthorProfiles(indexableBlogPosts).map((author) => `/blog/authors/${author.slug}`),
    ...getAllBlogHubIds().map((hubId) => blogHubPath(hubId)),
    ...indexableBlogPosts.map((post) => `/blog/${post.slug}`),
  ];
  const immigrationPaths = getPagesBySection("immigration").map((page) => contentPageHref(page));
  const guidePaths = guideSlugs.map((slug) => `/guide/${slug}`);
  const guideTopicPaths = getAllGuideTopics().map((topic) => guideTopicHref(topic.slug));
  const destinationPaths = destinationSlugs.map((slug) => `/destinations/${slug}`);
  const legalPaths = legalSlugs.map((slug) => `/legal/${slug}`);
  const flightRoutePaths = FLIGHT_POPULAR_ROUTES.map((route) => `/flights/${route.id}`);
  const organizerPaths = PUBLIC_ORGANIZERS.map(
    (user) => `/organizers/${user.id}`
  );

  return filterRuSitemapPaths([
    ...YANDEX_PRIORITY_HUB_PATHS,
    ...navPaths,
    ...footerPaths,
    ...tourPaths,
    ...excursionPaths,
    ...placesPaths,
    ...apartmentPaths,
    ...blogPaths,
    ...immigrationPaths,
    ...guidePaths,
    ...guideTopicPaths,
    GUIDE_ABOUT_ARGENTINA_PATH,
    ...destinationPaths,
    ...legalPaths,
    ...kbPaths,
    ...flightRoutePaths,
    ...organizerPaths,
  ]).filter(isIndexableInternalPath);
}

/**
 * Final public-availability gate shared with middleware. Keeping it after all
 * collectors prevents a disabled, 404 or noindex route from being reintroduced
 * by navigation, footer or a future catalog source.
 */
export function filterSitemapPathsByPublicSettings(
  paths: string[],
  navigation: SiteNavigationGlobal,
  modules: SiteModulesGlobal,
): string[] {
  return filterRuSitemapPaths(paths).filter(
    (path) =>
      isIndexableInternalPath(path) &&
      isPublicPathIncludedInSitemap(path, navigation, modules) &&
      isTravelModulePathEnabled(path, modules),
  );
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

  const controlPlane = await fetchSiteControlPlaneEdge();
  const visiblePaths = filterSitemapPathsByPublicSettings(
    await collectSitemapPaths({ blogCatalog }),
    controlPlane.navigation,
    controlPlane.modules,
  );
  const paths = expandI18nSitemapPaths(visiblePaths);

  return paths.map((path) => {
    const lastModified =
      contentUpdatedAt.get(path) ?? blogUpdatedAt.get(path) ?? legalUpdatedAt.get(path);
    const priority = getBlogSitemapPriority(path, blogPostsBySlug);
    return toSitemapEntry(path, lastModified, priority);
  });
}
