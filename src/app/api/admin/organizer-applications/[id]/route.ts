import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { notifyOrganizerApplicationReview } from "@/lib/admin/moderation-notify";
import { fetchOrganizerApplicationById } from "@/lib/admin/organizer-applications-server";
import { emitNotificationEvent } from "@/lib/notifications/notifications-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

type PatchBody = {
  action?: "approve" | "reject";
  note?: string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await request.json()) as PatchBody;

  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "Укажите action: approve или reject" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const application = await fetchOrganizerApplicationById(supabase, id);
  if (!application) {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }
  if (application.status !== "pending") {
    return NextResponse.json(
      { error: "Заявка уже рассмотрена. Обновите страницу." },
      { status: 409 }
    );
  }

  const reviewedAt = new Date().toISOString();
  const reviewStatus = body.action === "approve" ? "approved" : "rejected";
  const reviewNote = body.note?.trim() || null;

  const { error: updateError } = await supabase
    .from("organizer_applications")
    .update({
      status: reviewStatus,
      reviewed_at: reviewedAt,
      reviewed_by: auth.actorId,
      review_note: reviewNote,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (body.action === "approve") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, roles")
      .eq("id", application.userId)
      .maybeSingle();

    if (profile) {
      const roles = profile.roles ?? [];
      const nextRoles = roles.includes("organizer")
        ? roles
        : [...roles, "organizer" as const];
      await supabase
        .from("profiles")
        .update({
          roles: nextRoles,
          active_role: "organizer",
          organizer_verified_at: reviewedAt,
        })
        .eq("id", profile.id);

      await emitNotificationEvent(supabase, {
        userId: profile.id,
        dedupeKey: `organizer:application-approved:${application.id}`,
        eventType: "organizer_application_approved",
        category: "system",
        title: "Заявка организатора одобрена",
        body: "Чек-лист: Создайте первый тур и отправьте его на модерацию.",
        href: "/organizer/tours?welcome=1",
        metadata: {
          application_id: application.id,
          checklist: ["Создайте первый тур"],
        } as Json,
        channels: ["in_app"],
      });
    }
  }

  await notifyOrganizerApplicationReview({
    applicantEmail: application.applicantEmail ?? "",
    applicantName: application.applicantName,
    action: body.action,
    note: reviewNote ?? undefined,
  });

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: `organizer_application.${body.action}`,
    entityType: "organizer_application",
    entityId: id,
    payload: { note: reviewNote },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ ok: true });
}
