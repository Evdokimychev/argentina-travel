import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { restoreCmsDocumentFromRevision } from "@/lib/cms/content-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RestoreBody = {
  publish?: boolean;
};

type RouteContext = {
  params: Promise<{ id: string; revisionId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as RestoreBody;
  if (body.publish) {
    const publishAuth = await authorizeAdminRequest(request, "content.publish");
    if (!publishAuth.ok) return publishAuth.response;
  }

  const { id, revisionId } = await context.params;
  const decodedDocumentId = decodeURIComponent(id);
  const decodedRevisionId = decodeURIComponent(revisionId);
  const supabase = createSupabaseAdminClient();
  const result = await restoreCmsDocumentFromRevision(
    supabase,
    decodedDocumentId,
    decodedRevisionId,
    {
      actorId: auth.actorId,
      publish: body.publish,
    }
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: body.publish ? "cms.document.restore_and_publish" : "cms.document.restore",
    entityType: "content_document",
    entityId: decodedDocumentId,
    payload: {
      revisionId: result.restoredRevision.id,
      revisionNumber: result.restoredRevision.revisionNumber,
      restoredStatus: result.document.status,
    },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ document: result.document });
}
