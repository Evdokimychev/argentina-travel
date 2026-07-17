import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest } from "@/lib/admin/audit";
import { cmsMutationHttpStatus, getCmsDocumentById, restoreCmsDocumentFromRevision } from "@/lib/cms/content-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RestoreBody = {
  publish?: boolean;
  expectedVersion?: number;
};

type RouteContext = {
  params: Promise<{ id: string; revisionId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as RestoreBody;
  if (!Number.isInteger(body.expectedVersion) || (body.expectedVersion ?? 0) < 1) {
    return NextResponse.json({ error: "Обновите страницу и повторите восстановление" }, { status: 409 });
  }
  const { id, revisionId } = await context.params;
  const decodedDocumentId = decodeURIComponent(id);
  const decodedRevisionId = decodeURIComponent(revisionId);
  const supabase = createSupabaseAdminClient();
  const current = await getCmsDocumentById(supabase, decodedDocumentId);
  if (!current) return NextResponse.json({ error: "Документ не найден" }, { status: 404 });
  const requiresPublish =
    body.publish === true || current.status === "published" || current.status === "scheduled";
  if (requiresPublish) {
    const publishAuth = await authorizeAdminRequest(request, "content.publish");
    if (!publishAuth.ok) return publishAuth.response;
  }
  const result = await restoreCmsDocumentFromRevision(
    supabase,
    decodedDocumentId,
    decodedRevisionId,
    {
      actorId: auth.actorId,
      publish: body.publish,
      allowPublish: requiresPublish,
      expectedVersion: body.expectedVersion!,
      ipAddress: clientIpFromRequest(request),
    }
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: cmsMutationHttpStatus(result.code) });
  }

  return NextResponse.json({ document: result.document });
}
