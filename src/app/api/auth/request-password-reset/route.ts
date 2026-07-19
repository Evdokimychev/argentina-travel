import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import {
  isValidAuthEmail,
  normalizeAuthEmail,
  parseRetryAfterSeconds,
} from "@/lib/auth-flow";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { hashRateLimitIdentifier } from "@/lib/rate-limit-identifier";
import { authRedirectUrl } from "@/lib/site-url";

const NEUTRAL_MESSAGE =
  "Если этот адрес зарегистрирован, мы отправили ссылку для изменения пароля.";

function rateLimitedResponse(retryAfter: number) {
  return NextResponse.json(
    {
      error: {
        code: "AUTH_RESET_RATE_LIMITED",
        retryAfter,
        message: `Повторная отправка будет доступна через ${retryAfter} секунд.`,
      },
    },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ipLimit = await checkRateLimit(`auth:password-reset:ip:${ip}`, 5, 10 * 60_000);
  if (!ipLimit.ok) {
    return rateLimitedResponse(ipLimit.retryAfterSec);
  }

  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json(
      {
        error: {
          code: "AUTH_CONFIGURATION_ERROR",
          message: "Восстановление пароля временно недоступно.",
        },
      },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as { email?: string } | null;
    const email = normalizeAuthEmail(body?.email ?? "");
    if (!isValidAuthEmail(email)) {
      return NextResponse.json(
        { error: { code: "AUTH_INVALID_EMAIL", message: "Укажите корректный email." } },
        { status: 400 }
      );
    }

    const emailHash = hashRateLimitIdentifier("auth-password-reset", email);
    const emailLimit = await checkRateLimit(
      `auth:password-reset:email:${emailHash}`,
      3,
      15 * 60_000,
    );
    if (!emailLimit.ok) {
      return rateLimitedResponse(emailLimit.retryAfterSec);
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl(
        "/auth/confirm?next=/account/update-password",
        request.url
      ),
    });

    if (error?.status === 429) {
      const retryAfter = parseRetryAfterSeconds(error, 60);
      return rateLimitedResponse(retryAfter);
    }

    if (error) {
      console.error("[auth.reset.request] delivery rejected", {
        code: error.code,
        status: error.status,
      });
      return NextResponse.json(
        {
          error: {
            code: "AUTH_EMAIL_DELIVERY_FAILED",
            message: "Письмо не удалось отправить. Попробуйте немного позже.",
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, message: NEUTRAL_MESSAGE });
  } catch (error) {
    console.error("[auth.reset.request] unavailable", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      {
        error: {
          code: "AUTH_RESET_UNAVAILABLE",
          message: "Сервис восстановления временно недоступен.",
        },
      },
      { status: 503 }
    );
  }
}
