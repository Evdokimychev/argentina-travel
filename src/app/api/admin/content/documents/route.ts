import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createCmsDocument, listCmsDocuments } from "@/lib/cms/content-server";
import { groupCmsDocuments } from "@/lib/cms/cms-locale";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { LEGAL_DOCUMENTS } from "@/data/legal-content";
import { getBlogPostBySlug } from "@/data/blog";
import { getContentPage } from "@/lib/content-pages";
import { getDestinationBySlug } from "@/lib/destinations";
import { fetchPlaceBySlugServer } from "@/lib/places-repository";
import {
  legalBodyFromTs,
  blogBodyFromTs,
  guideBodyFromTs,
  destinationBodyFromTs,
  placeBodyFromTs,
  type CmsDocType,
  type CmsDocumentBody,
} from "@/types/cms-content";

type PostBody = {
  docType?: CmsDocType;
  slug?: string;
  locale?: string;
  title?: string;
  body?: CmsDocumentBody;
  importFromSource?: boolean;
};

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const docType = url.searchParams.get("docType") as CmsDocType | null;
  const grouped = url.searchParams.get("grouped") === "true";

  const supabase = createSupabaseAdminClient();
  const documents = await listCmsDocuments(supabase, docType ? { docType } : undefined);

  if (grouped) {
    return NextResponse.json({ documents, grouped: groupCmsDocuments(documents) });
  }

  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as PostBody;
  const docType = body.docType;
  const slug = body.slug?.trim();

  if (!docType || !slug) {
    return NextResponse.json({ error: "Укажите docType и slug" }, { status: 400 });
  }

  let title = body.title?.trim();
  let cmsBody = body.body;

  if (body.importFromSource && docType === "legal") {
    const source = LEGAL_DOCUMENTS[slug];
    if (!source) {
      return NextResponse.json({ error: "Исходный legal-документ не найден" }, { status: 404 });
    }
    title = title || source.title;
    cmsBody = legalBodyFromTs(source);
  }

  if (body.importFromSource && docType === "blog") {
    const source = getBlogPostBySlug(slug);
    if (!source) {
      return NextResponse.json({ error: "Исходная статья не найдена" }, { status: 404 });
    }
    title = title || source.title;
    cmsBody = blogBodyFromTs(source);
  }

  if (body.importFromSource && docType === "guide") {
    const source = getContentPage("guide", slug);
    if (!source) {
      return NextResponse.json({ error: "Исходная страница путеводителя не найдена" }, { status: 404 });
    }
    title = title || source.title;
    cmsBody = guideBodyFromTs(source);
  }

  if (body.importFromSource && docType === "destination") {
    const source = getDestinationBySlug(slug);
    if (!source) {
      return NextResponse.json({ error: "Исходная страница направления не найдена" }, { status: 404 });
    }
    title = title || source.name;
    cmsBody = destinationBodyFromTs(source);
  }

  if (body.importFromSource && docType === "place") {
    const source = await fetchPlaceBySlugServer(slug);
    if (!source) {
      return NextResponse.json({ error: "Исходная страница места не найдена" }, { status: 404 });
    }
    title = title || source.name;
    cmsBody = placeBodyFromTs(source);
  }

  if (!title || !cmsBody) {
    return NextResponse.json({ error: "Укажите title и body или importFromSource" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const result = await createCmsDocument(supabase, {
    docType,
    slug,
    locale: body.locale,
    title,
    body: cmsBody,
    actorId: auth.actorId,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "cms.document.create",
    entityType: "content_document",
    entityId: result.document.id,
    payload: { docType, slug },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ document: result.document }, { status: 201 });
}
