import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { parseScheduledPublishAt } from "@/lib/cms/cms-scheduled-publish";
import { cancelCmsDocumentSchedule, scheduleCmsDocument } from "@/lib/cms/content-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CmsDocumentBody, CmsDocumentSeo } from "@/types/cms-content";

type ScheduleBody = {
  scheduledPublishAt: string;
  title?: string;
  body?: CmsDocumentBody;
  seo?: CmsDocumentSeo;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "content.publish");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const decodedId = decodeURIComponent(id);
  const body = (await request.json()) as ScheduleBody;
  const scheduledPublishAt = parseScheduledPublishAt(body.scheduledPublishAt);
  if (!scheduledPublishAt) {
    return NextResponse.json({ error: "Укажите дату и время публикации" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const result = await scheduleCmsDocument(supabase, decodedId, {
    scheduledPublishAt,
    title: body.title,
    body: body.body,
    seo: body.seo,
    actorId: auth.actorId,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "cms.document.schedule",
    entityType: "content_document",
    entityId: decodedId,
    payload: { scheduledPublishAt: result.document.scheduledPublishAt },
    ipAddress: clientIpFromRequest(request),
  });

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
  const result = await cancelCmsDocumentSchedule(supabase, decodedId, auth.actorId);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "cms.document.unschedule",
    entityType: "content_document",
    entityId: decodedId,
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ document: result.document });
}
