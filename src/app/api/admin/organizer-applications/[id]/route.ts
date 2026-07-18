import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest } from "@/lib/admin/audit";
import { notifyOrganizerApplicationReview } from "@/lib/admin/moderation-notify";
import { fetchOrganizerApplicationById } from "@/lib/admin/organizer-applications-server";
import { isUuid } from "@/lib/admin/user-identity-management";
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
  if (auth.via !== "session" || !isUuid(auth.actorId)) {
    return NextResponse.json(
      {
        error: "Решение по заявке требует подтверждённой сессии администратора.",
        code: "ADMIN_SESSION_REQUIRED",
      },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json(
      { error: "Некорректный идентификатор заявки", code: "INVALID_APPLICATION_ID" },
      { status: 400 },
    );
  }

  const rawBody = await request.json().catch(() => null);
  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }
  const body = rawBody as PatchBody;

  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "Укажите action: approve или reject" }, { status: 400 });
  }
  if (body.note !== undefined && typeof body.note !== "string") {
    return NextResponse.json({ error: "Комментарий должен быть строкой" }, { status: 400 });
  }
  if (body.note && body.note.trim().length > 4000) {
    return NextResponse.json({ error: "Комментарий не должен превышать 4000 символов" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const reviewNote = body.note?.trim() || null;
  const { data: decisionRows, error: decisionError } = await supabase.rpc(
    "admin_decide_organizer_application",
    {
      p_application_id: id,
      p_actor_user_id: auth.actorId,
      p_decision: body.action,
      p_review_note: reviewNote,
      p_ip_address: clientIpFromRequest(request),
    },
  );

  if (decisionError) {
    const errorCode = decisionError.message;
    if (errorCode.includes("ORGANIZER_APPLICATION_NOT_FOUND")) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }
    if (
      errorCode.includes("ORGANIZER_APPLICATION_ALREADY_DECIDED") ||
      errorCode.includes("ORGANIZER_APPLICATION_DECISION_CONFLICT")
    ) {
      return NextResponse.json(
        { error: "Заявка уже рассмотрена другим администратором. Обновите страницу." },
        { status: 409 },
      );
    }
    if (errorCode.includes("ORGANIZER_DECISION_FORBIDDEN")) {
      return NextResponse.json({ error: "Недостаточно прав для решения по заявке" }, { status: 403 });
    }
    return NextResponse.json({ error: "Не удалось сохранить решение по заявке" }, { status: 500 });
  }

  const decision = decisionRows?.[0];
  if (!decision) {
    return NextResponse.json({ error: "База данных не подтвердила решение" }, { status: 500 });
  }
  if (!decision.changed) {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  // The decision and audit evidence committed together. Notifications and
  // email are intentionally dispatched only after that database transaction.
  const application = await fetchOrganizerApplicationById(supabase, id);
  if (!application) {
    return NextResponse.json(
      { ok: true, warning: "Решение сохранено, но данные уведомления не прочитаны" },
      { status: 200 },
    );
  }

  const afterCommitTasks: Promise<unknown>[] = [];
  if (body.action === "approve") {
    afterCommitTasks.push(
      emitNotificationEvent(supabase, {
        userId: decision.applicant_user_id,
        dedupeKey: `organizer:application-approved:${decision.application_id}`,
        eventType: "organizer_application_approved",
        category: "system",
        title: "Заявка организатора одобрена",
        body: "Чек-лист: Создайте первый тур и отправьте его на модерацию.",
        href: "/organizer/tours?welcome=1",
        metadata: {
          application_id: decision.application_id,
          checklist: ["Создайте первый тур"],
        } as Json,
        channels: ["in_app"],
      }),
    );
  }

  afterCommitTasks.push(
    notifyOrganizerApplicationReview({
      applicantEmail: application.applicantEmail ?? "",
      applicantName: application.applicantName,
      action: body.action,
      note: reviewNote ?? undefined,
    }),
  );
  await Promise.allSettled(afterCommitTasks);

  return NextResponse.json({ ok: true });
}
