import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";
import { authRedirectUrl } from "@/lib/site-url";

async function postRequestPasswordReset(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json(
      { error: "Восстановление пароля недоступно в демо-режиме без Supabase." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Укажите корректный email" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl("/auth/callback?next=/auth/reset-password", request.url),
    });

    if (error) {
      return NextResponse.json(
        { error: "Не удалось отправить письмо. Попробуйте ещё раз через несколько минут." },
        { status: error.status === 429 ? 429 : 502 }
      );
    }

    // Не раскрываем, есть ли аккаунт с такой почтой.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Сервис восстановления временно недоступен. Попробуйте позже." },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(postRequestPasswordReset, {
  limit: 5,
  window: 300_000,
  keyPrefix: "auth:request-password-reset",
  key: (request) => `ip:${getClientIp(request)}`,
  message: "Слишком много запросов на восстановление пароля. Попробуйте позже.",
});
