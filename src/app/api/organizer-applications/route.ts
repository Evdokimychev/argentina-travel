import { NextResponse } from "next/server";
import { getClientIp, checkSecurityRateLimit } from "@/lib/rate-limit";
import { notifyLeadCaptured } from "@/lib/leads-notify";
import { escapeHtml } from "@/lib/notifications/email-templates";
import { fetchSiteFeatures } from "@/lib/site-settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { unexpectedPublicApiError } from "@/lib/public-api/safe-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OrganizerApplicationBody = {
  companyName?: string;
  description?: string;
};

function trimInput(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Войдите в аккаунт, чтобы увидеть статус заявки." },
      { status: 401 }
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: application, error } = await admin
    .from("organizer_applications")
    .select("id, status, company_name, created_at, reviewed_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Не удалось загрузить заявку." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    application: application
      ? {
          id: application.id,
          status: application.status,
          companyName: application.company_name,
          createdAt: application.created_at,
          reviewedAt: application.reviewed_at,
        }
      : null,
  });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = await checkSecurityRateLimit(`organizer-application:ip:${ip}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  try {
    const features = await fetchSiteFeatures();
    if (!features.allowOrganizerSignup) {
      return NextResponse.json(
        { error: "Приём заявок организаторов временно приостановлен." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as OrganizerApplicationBody;
    const companyName = trimInput(body.companyName);
    const description = trimInput(body.description);

    if (companyName.length < 2) {
      return NextResponse.json(
        { error: "Укажите название проекта или компании (минимум 2 символа)." },
        { status: 400 }
      );
    }
    if (description.length < 30) {
      return NextResponse.json(
        { error: "Опишите ваш опыт и формат туров (минимум 30 символов)." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Войдите в аккаунт, чтобы отправить заявку." },
        { status: 401 }
      );
    }

    const admin = createSupabaseAdminClient();

    const { data: existingPending } = await admin
      .from("organizer_applications")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPending) {
      return NextResponse.json(
        { error: "У вас уже есть заявка на рассмотрении." },
        { status: 409 }
      );
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("id, first_name, last_name, email, phone, roles")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "Профиль не найден. Перезайдите в аккаунт и попробуйте снова." },
        { status: 404 }
      );
    }
    if ((profile.roles ?? []).includes("organizer")) {
      return NextResponse.json(
        { error: "Роль организатора уже подключена. Перейдите в кабинет." },
        { status: 409 }
      );
    }

    const { data: application, error: insertError } = await admin
      .from("organizer_applications")
      .insert({
        user_id: user.id,
        company_name: companyName,
        description,
      })
      .select("id")
      .single();

    if (insertError || !application) {
      if (insertError?.code === "23505") {
        return NextResponse.json(
          { error: "У вас уже есть заявка на рассмотрении." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Не удалось отправить заявку." },
        { status: 500 }
      );
    }

    const applicantName = `${profile.first_name} ${profile.last_name}`.trim() || profile.email || "Пользователь";

    void notifyLeadCaptured({
      subject: "Новая заявка организатора",
      html: `<p><strong>${escapeHtml(applicantName)}</strong></p>
<p>Email: ${escapeHtml(profile.email ?? "—")}<br/>Телефон: ${escapeHtml(profile.phone ?? "—")}</p>
<p>Компания: ${escapeHtml(companyName)}</p>
<p>${escapeHtml(description)}</p>`,
    });

    return NextResponse.json({
      ok: true,
      applicationId: application.id,
      checklist: ["Создайте первый тур"],
    });
  } catch {
    return NextResponse.json(unexpectedPublicApiError(), { status: 500 });
  }
}
