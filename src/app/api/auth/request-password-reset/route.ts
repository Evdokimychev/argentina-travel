import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";

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

    const origin = new URL(request.url).origin;
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
    });

    // Не раскрываем, есть ли аккаунт с такой почтой.
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
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
