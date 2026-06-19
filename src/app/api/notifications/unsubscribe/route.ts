import { NextResponse } from "next/server";
import { disableEmailNotificationCategory } from "@/lib/notifications/notifications-server";
import { verifyUnsubscribeToken } from "@/lib/notifications/unsubscribe-token";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NOTIFICATION_CATEGORY_LABELS } from "@/types/notifications-hub";

function renderHtmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f1f5f9; margin: 0; padding: 32px 16px; color: #0f172a; }
    main { max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 28px 24px; box-shadow: 0 8px 24px rgba(15,23,42,0.08); }
    h1 { font-size: 22px; margin: 0 0 12px; }
    p { line-height: 1.6; margin: 0; color: #334155; }
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    <p>${message}</p>
  </main>
</body>
</html>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return new NextResponse(
      renderHtmlPage("Не удалось отписаться", "Ссылка недействительна или устарела."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const payload = verifyUnsubscribeToken(token);
  if (!payload) {
    return new NextResponse(
      renderHtmlPage("Не удалось отписаться", "Ссылка недействительна или устарела."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    await disableEmailNotificationCategory(supabase, payload.userId, payload.category);

    const categoryLabel = NOTIFICATION_CATEGORY_LABELS[payload.category];
    return new NextResponse(
      renderHtmlPage(
        "Вы отписаны",
        `Письма категории «${categoryLabel}» больше не будут приходить на ваш email. Настройки можно изменить в личном кабинете.`
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch {
    return new NextResponse(
      renderHtmlPage("Ошибка", "Не удалось сохранить настройки. Попробуйте позже или измените их в личном кабинете."),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

/** RFC 8058 one-click unsubscribe stub (POST). */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
  }

  const payload = verifyUnsubscribeToken(token);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    await disableEmailNotificationCategory(supabase, payload.userId, payload.category);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to update preferences" }, { status: 500 });
  }
}
