import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { cmsFallbackRobots, getCmsResolverMetadata } from "@/lib/cms/content-resolver";

type BuildCmsPageMetadataOptions = {
  content: unknown;
  title: string;
  description: string;
  path: string;
  image?: string;
  canonical?: string;
  alternates?: Metadata["alternates"];
};

/**
 * Public metadata with CMS SEO overrides applied consistently to title,
 * description, canonical, robots and social cards.
 */
export function buildCmsPageMetadata({
  content,
  title,
  description,
  path,
  image,
  canonical,
  alternates,
}: BuildCmsPageMetadataOptions): Metadata {
  const seo = getCmsResolverMetadata(content)?.seo;
  const seoDescription = seo?.description?.trim();
  const metadata = buildPublicPageMetadata({
    title: seo?.title || title,
    // Legacy CMS records can contain snippets too short to explain the page.
    // Route-specific copy is more useful until an editor supplies 50+ chars.
    description:
      seoDescription && seoDescription.length >= 50 ? seoDescription : description,
    path,
    image: seo?.image || image,
    canonical: seo?.canonical || canonical,
  });

  return {
    ...metadata,
    alternates: {
      ...alternates,
      ...metadata.alternates,
    },
    robots: cmsFallbackRobots(content),
  };
}
