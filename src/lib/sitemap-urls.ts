import type { MetadataRoute } from "next";
import { blogPosts } from "@/data/blog";
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
} from "@/lib/content-pages";
import { getAllGuideTopics, guideTopicHref } from "@/lib/guide-topics";
import { getAllDestinations } from "@/lib/destinations";
import { flattenSiteNavSections } from "@/lib/site-nav";
import { absoluteUrl } from "@/lib/site-url";

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
  lastModified?: string | Date
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(path),
    lastModified: lastModified ? new Date(lastModified) : new Date(),
  };
}

export function collectSitemapPaths(): string[] {
  const navPaths = flattenSiteNavSections(SITE_NAV_SECTIONS)
    .map((link) => link.href)
    .filter(isIndexableInternalPath);

  const footerPaths = [
    ...SITE_FOOTER_NAV.map((link) => link.href),
    ...SITE_FOOTER_CONTACTS.map((link) => link.href),
  ].filter(isIndexableInternalPath);

  const tourPaths = marketplaceTours.map((tour) => `/tours/${tour.slug}`);
  const blogPaths = blogPosts.map((post) => `/blog/${post.slug}`);
  const contentPaths = getAllContentPages().map((page) => contentPageHref(page));
  const guideTopicPaths = getAllGuideTopics().map((topic) => guideTopicHref(topic.slug));
  const destinationPaths = getAllDestinations().map(
    (destination) => `/destinations/${destination.id}`
  );
  const legalPaths = Object.values(LEGAL_DOCUMENTS).map((doc) => `/legal/${doc.slug}`);
  const organizerPaths = SEED_USERS.filter((user) => user.roles?.includes("organizer")).map(
    (user) => `/organizers/${user.id}`
  );

  return uniquePaths([
    ...navPaths,
    ...footerPaths,
    ...tourPaths,
    ...blogPaths,
    ...contentPaths,
    ...guideTopicPaths,
    ...destinationPaths,
    ...legalPaths,
    ...organizerPaths,
  ]);
}

export function buildSitemapEntries(): MetadataRoute.Sitemap {
  const contentUpdatedAt = new Map(
    getAllContentPages().map((page) => [contentPageHref(page), page.updatedAt])
  );
  const blogUpdatedAt = new Map(blogPosts.map((post) => [`/blog/${post.slug}`, post.date]));
  const legalUpdatedAt = new Map(
    Object.values(LEGAL_DOCUMENTS).map((doc) => [`/legal/${doc.slug}`, doc.updatedAt])
  );

  return collectSitemapPaths().map((path) => {
    const lastModified =
      contentUpdatedAt.get(path) ?? blogUpdatedAt.get(path) ?? legalUpdatedAt.get(path);
    return toSitemapEntry(path, lastModified);
  });
}
