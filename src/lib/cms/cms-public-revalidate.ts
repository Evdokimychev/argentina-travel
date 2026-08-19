import { revalidatePath, revalidateTag } from "next/cache";
import type { CmsDocType } from "@/types/cms-content";

const CMS_CACHE_TAGS = ["cms", "blog-catalog", "knowledge", "guide", "destinations", "places"] as const;

function publicPathsForCmsDocument(docType: CmsDocType, slug: string): string[] {
  switch (docType) {
    case "blog":
      return ["/blog", `/blog/${slug}`];
    case "author_article":
      return ["/blog", `/blog/author/${slug}`];
    case "knowledge":
      return ["/baza-znaniy", `/baza-znaniy/${slug}`];
    case "guide":
      return ["/guide", `/guide/${slug}`];
    case "landing":
      return [`/${slug}`];
    case "destination":
      return ["/destinations", `/destinations/${slug}`];
    case "place":
      return ["/places", `/places/${slug}`];
    case "legal":
      return [`/${slug}`];
    default: {
      const _exhaustive: never = docType;
      return [_exhaustive];
    }
  }
}

/**
 * Invalidate public CMS surfaces after a persisted mutation.
 * Tags cover catalog caches; paths cover detail + listing ISR.
 */
export function revalidateCmsPublicSurfaces(input: {
  docType: CmsDocType;
  slug: string;
}): void {
  try {
    for (const tag of CMS_CACHE_TAGS) {
      revalidateTag(tag);
    }
    revalidateTag(`cms:${input.docType}`);
    for (const path of publicPathsForCmsDocument(input.docType, input.slug)) {
      revalidatePath(path);
    }
    revalidatePath("/sitemap.xml");
  } catch {
    // next/cache is a no-op outside a Next request (unit tests, scripts).
  }
}

export function cmsPublicPathsForTest(docType: CmsDocType, slug: string): string[] {
  return publicPathsForCmsDocument(docType, slug);
}
