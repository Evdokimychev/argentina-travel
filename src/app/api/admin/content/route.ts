import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { buildContentInventory } from "@/lib/admin/content-inventory";
import { fetchCmsOverrideMap, legalOverrideId } from "@/lib/cms/legal-resolver";
import { blogOverrideId } from "@/lib/cms/blog-resolver";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { LEGAL_DOCUMENTS } from "@/data/legal-content";
import { getEditorialBlogPosts } from "@/data/blog";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const inventory = buildContentInventory();
  const supabase = createSupabaseAdminClient();
  const cmsMap = await fetchCmsOverrideMap(supabase);

  const legalEditable = Object.values(LEGAL_DOCUMENTS).map((doc) => {
    const cmsId = legalOverrideId(doc.slug);
    const override = cmsMap.get(cmsId);
    return {
      slug: doc.slug,
      title: doc.title,
      href: `/legal/${doc.slug}`,
      cmsId,
      cmsStatus: override?.status ?? null,
      hasOverride: Boolean(override),
      publicSource: override?.status === "published" ? "cms" : "file",
    };
  });

  const blogEditable = getEditorialBlogPosts().slice(0, 80).map((post) => {
    const cmsId = blogOverrideId(post.slug);
    const override = cmsMap.get(cmsId);
    const featuredFromCms =
      override?.status === "published" && override.body.kind === "blog" && override.body.featured === true;
    return {
      slug: post.slug,
      title: post.title,
      href: `/blog/${post.slug}`,
      cmsId,
      cmsStatus: override?.status ?? null,
      hasOverride: Boolean(override),
      publicSource: override?.status === "published" ? "cms" : "file",
      featuredFromCms,
    };
  });

  const cmsDocuments = Array.from(cmsMap.values()).map((doc) => ({
    id: doc.id,
    docType: doc.docType,
    slug: doc.slug,
    title: doc.title,
    status: doc.status,
    updatedAt: doc.updatedAt,
  }));

  return NextResponse.json({
    ...inventory,
    cmsDocuments,
    legalEditable,
    blogEditable,
    cmsCount: cmsDocuments.length,
  });
}
