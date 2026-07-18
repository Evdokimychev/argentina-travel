import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import {
  cmsMutationHttpStatus,
  deleteCmsDocument,
  getCmsDocumentById,
  updateCmsDocument,
} from "@/lib/cms/content-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateAndNormalizeCmsSeo } from "@/lib/cms/seo-utils";
import type { CmsDocumentBody, CmsDocumentSeo, CmsDocumentStatus } from "@/types/cms-content";

type PatchBody = {
  title?: string;
  body?: CmsDocumentBody;
  seo?: CmsDocumentSeo;
  status?: CmsDocumentStatus;
  expectedVersion?: number;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(_request, "content.edit");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const decodedId = decodeURIComponent(id);
  const supabase = createSupabaseAdminClient();
  const document = await getCmsDocumentById(supabase, decodedId);

  if (!document) {
    return NextResponse.json({ error: "Документ не найден" }, { status: 404 });
  }

  return NextResponse.json({ document });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const decodedId = decodeURIComponent(id);
  const body = (await request.json().catch(() => null)) as PatchBody | null;
  if (!body || !Number.isInteger(body.expectedVersion) || (body.expectedVersion ?? 0) < 1) {
    return NextResponse.json({ error: "Обновите страницу и повторите сохранение" }, { status: 409 });
  }
  const validatedSeo = body.seo === undefined ? null : validateAndNormalizeCmsSeo(body.seo);
  if (validatedSeo && !validatedSeo.ok) {
    return NextResponse.json({ error: validatedSeo.error }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const current = await getCmsDocumentById(supabase, decodedId);
  if (!current) return NextResponse.json({ error: "Документ не найден" }, { status: 404 });
  const requiresPublish =
    current.status === "published" ||
    current.status === "scheduled" ||
    body.status === "published" ||
    body.status === "scheduled";
  if (requiresPublish) {
    const publishAuth = await authorizeAdminRequest(request, "content.publish");
    if (!publishAuth.ok) return publishAuth.response;
  }

  const result = await updateCmsDocument(supabase, decodedId, {
    title: body.title,
    body: body.body,
    seo: validatedSeo?.seo,
    status: body.status,
    actorId: auth.actorId,
    expectedVersion: body.expectedVersion!,
    allowPublish: requiresPublish,
    ipAddress: clientIpFromRequest(request),
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: cmsMutationHttpStatus(result.code) },
    );
  }

  return NextResponse.json({ document: result.document });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "content.publish");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const decodedId = decodeURIComponent(id);
  const supabase = createSupabaseAdminClient();
  const result = await deleteCmsDocument(supabase, decodedId);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "cms.document.delete",
    entityType: "content_document",
    entityId: decodedId,
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ ok: true });
}
