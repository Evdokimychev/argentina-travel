import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { buildContentInventory } from "@/lib/admin/content-inventory";
import { buildCmsLocaleCoverage, computeTranslationCoverageByType } from "@/lib/cms/cms-locale";
import { fetchCmsOverrideMap } from "@/lib/cms/content-resolver";
import { blogOverrideId } from "@/lib/cms/blog-resolver";
import { guideOverrideId } from "@/lib/cms/guide-resolver";
import {
  destinationOverrideId,
  resolveDestinationCatalog,
} from "@/lib/cms/destination-resolver";
import { placeOverrideId, resolvePlaceCatalog } from "@/lib/cms/place-resolver";
import { legalOverrideId } from "@/lib/cms/legal-resolver";
import { getPagesBySection } from "@/lib/content-pages";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { LEGAL_DOCUMENTS } from "@/data/legal-content";
import { getEditorialBlogPosts } from "@/data/blog";
import { getAllDestinations } from "@/lib/destinations";
import { fetchPlaceSlugsServer } from "@/lib/places-repository";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const inventory = buildContentInventory();
  const supabase = createSupabaseAdminClient();
  const cmsMap = await fetchCmsOverrideMap(supabase);

  const legalEditable = Object.values(LEGAL_DOCUMENTS).map((doc) => {
    const cmsId = legalOverrideId(doc.slug);
    const override = cmsMap.get(cmsId);
    const localeCoverage = buildCmsLocaleCoverage("legal", doc.slug, cmsMap);
    return {
      slug: doc.slug,
      title: doc.title,
      href: `/legal/${doc.slug}`,
      cmsId,
      cmsStatus: override?.status ?? null,
      hasOverride: Boolean(override),
      publicSource: override?.status === "published" ? "cms" : "file",
      localeCoverage,
    };
  });

  const blogEditable = getEditorialBlogPosts().slice(0, 80).map((post) => {
    const cmsId = blogOverrideId(post.slug);
    const override = cmsMap.get(cmsId);
    const featuredFromCms =
      override?.status === "published" && override.body.kind === "blog" && override.body.featured === true;
    const localeCoverage = buildCmsLocaleCoverage("blog", post.slug, cmsMap);
    return {
      slug: post.slug,
      title: post.title,
      href: `/blog/${post.slug}`,
      cmsId,
      cmsStatus: override?.status ?? null,
      hasOverride: Boolean(override),
      publicSource: override?.status === "published" ? "cms" : "file",
      featuredFromCms,
      localeCoverage,
    };
  });

  const guideEditable = getPagesBySection("guide").map((page) => {
    const cmsId = guideOverrideId(page.slug);
    const override = cmsMap.get(cmsId);
    const localeCoverage = buildCmsLocaleCoverage("guide", page.slug, cmsMap);
    return {
      slug: page.slug,
      title: page.title,
      href: `/guide/${page.slug}`,
      cmsId,
      cmsStatus: override?.status ?? null,
      hasOverride: Boolean(override),
      publicSource: override?.status === "published" ? "cms" : "file",
      localeCoverage,
    };
  });

  const destinationSourceSlugs = new Set(getAllDestinations().map((destination) => destination.id));
  const destinationCatalog = await resolveDestinationCatalog();
  const destinationEditable = destinationCatalog.map((destination) => {
    const cmsId = destinationOverrideId(destination.id);
    const override = cmsMap.get(cmsId);
    const hasFileSource = destinationSourceSlugs.has(destination.id);
    const localeCoverage = buildCmsLocaleCoverage("destination", destination.id, cmsMap);
    return {
      slug: destination.id,
      title: destination.name,
      href: `/destinations/${destination.id}`,
      cmsId,
      cmsStatus: override?.status ?? null,
      hasOverride: Boolean(override),
      publicSource:
        override?.status === "published"
          ? "cms"
          : hasFileSource
            ? "file"
            : override
              ? "cms"
              : "file",
      localeCoverage,
    };
  });

  const placeSourceSlugs = new Set(await fetchPlaceSlugsServer());
  const placeCatalog = await resolvePlaceCatalog();
  const placeEditable = placeCatalog.map((place) => {
    const cmsId = placeOverrideId(place.slug);
    const override = cmsMap.get(cmsId);
    const hasFileSource = placeSourceSlugs.has(place.slug);
    const localeCoverage = buildCmsLocaleCoverage("place", place.slug, cmsMap);
    return {
      slug: place.slug,
      title: place.name,
      href: `/places/${place.slug}`,
      cmsId,
      cmsStatus: override?.status ?? null,
      hasOverride: Boolean(override),
      publicSource:
        override?.status === "published"
          ? "cms"
          : hasFileSource
            ? "file"
            : override
              ? "cms"
              : "file",
      localeCoverage,
    };
  });

  const translationCoverage = computeTranslationCoverageByType([
    { docType: "legal", rows: legalEditable },
    { docType: "blog", rows: blogEditable },
    { docType: "guide", rows: guideEditable },
    { docType: "destination", rows: destinationEditable },
    { docType: "place", rows: placeEditable },
  ]);

  const cmsDocuments = Array.from(cmsMap.values()).map((doc) => ({
    id: doc.id,
    docType: doc.docType,
    slug: doc.slug,
    locale: doc.locale,
    title: doc.title,
    status: doc.status,
    updatedAt: doc.updatedAt,
  }));

  return NextResponse.json({
    ...inventory,
    cmsDocuments,
    legalEditable,
    blogEditable,
    guideEditable,
    destinationEditable,
    placeEditable,
    cmsCount: cmsDocuments.length,
    translationCoverage,
  });
}
