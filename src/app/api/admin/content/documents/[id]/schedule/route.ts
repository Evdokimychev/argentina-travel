import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest } from "@/lib/admin/audit";
import { parseScheduledPublishAt } from "@/lib/cms/cms-scheduled-publish";
import { cancelCmsDocumentSchedule, cmsMutationHttpStatus, scheduleCmsDocument } from "@/lib/cms/content-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateAndNormalizeCmsSeo } from "@/lib/cms/seo-utils";
import type { CmsDocumentBody, CmsDocumentSeo } from "@/types/cms-content";

type ScheduleBody = {
  scheduledPublishAt: string;
  title?: string;
  body?: CmsDocumentBody;
  seo?: CmsDocumentSeo;
  expectedVersion?: number;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "content.publish");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const decodedId = decodeURIComponent(id);
  const body = (await request.json().catch(() => null)) as ScheduleBody | null;
  if (!body || !Number.isInteger(body.expectedVersion) || (body.expectedVersion ?? 0) < 1) {
    return NextResponse.json({ error: "Обновите страницу и повторите планирование" }, { status: 409 });
  }
  const validatedSeo = body.seo === undefined ? null : validateAndNormalizeCmsSeo(body.seo);
  if (validatedSeo && !validatedSeo.ok) {
    return NextResponse.json({ error: validatedSeo.error }, { status: 400 });
  }
  const scheduledPublishAt = parseScheduledPublishAt(body.scheduledPublishAt);
  if (!scheduledPublishAt) {
    return NextResponse.json({ error: "Укажите дату и время публикации" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const result = await scheduleCmsDocument(supabase, decodedId, {
    scheduledPublishAt,
    title: body.title,
    body: body.body,
    seo: validatedSeo?.seo,
    actorId: auth.actorId,
    expectedVersion: body.expectedVersion!,
    ipAddress: clientIpFromRequest(request),
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: cmsMutationHttpStatus(result.code) });
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
  const body = (await request.json().catch(() => null)) as { expectedVersion?: number } | null;
  if (!body || !Number.isInteger(body.expectedVersion) || (body.expectedVersion ?? 0) < 1) {
    return NextResponse.json({ error: "Обновите страницу и повторите отмену" }, { status: 409 });
  }
  const supabase = createSupabaseAdminClient();
  const result = await cancelCmsDocumentSchedule(supabase, decodedId, {
    actorId: auth.actorId,
    expectedVersion: body.expectedVersion!,
    ipAddress: clientIpFromRequest(request),
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: cmsMutationHttpStatus(result.code) });
  }

  return NextResponse.json({ document: result.document });
}
