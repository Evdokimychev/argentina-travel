import { NextResponse } from "next/server";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";

/** @deprecated Вход выполняется на клиенте через supabase.auth.signInWithPassword. */
async function postLoginByPhone() {
  return NextResponse.json(
    { error: "Используйте клиентский вход через модальное окно авторизации." },
    { status: 410 }
  );
}

export const POST = withRateLimit(postLoginByPhone, {
  limit: 12,
  window: 60_000,
  keyPrefix: "auth:login-by-phone",
  key: (request) => `ip:${getClientIp(request)}`,
  message: "Слишком много попыток входа. Повторите позже.",
});
