import { NextResponse } from "next/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { normalizePhone } from "@/lib/auth-input";
import { unexpectedPublicApiError } from "@/lib/public-api/safe-error";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";

/** Поиск email по телефону — без входа, только для клиентского signIn. */
async function postLookupPhone(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Supabase auth disabled" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { phone?: string };
    const normalized = normalizePhone(body.phone ?? "");

    if (!normalized) {
      return NextResponse.json({ error: "Введите корректный номер телефона" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, status: "continue" });
  } catch {
    return NextResponse.json(unexpectedPublicApiError(), { status: 500 });
  }
}

export const POST = withRateLimit(postLookupPhone, {
  limit: 10,
  window: 60_000,
  keyPrefix: "auth:lookup-phone",
  key: (request) => `ip:${getClientIp(request)}`,
  message: "Слишком много запросов. Повторите позже.",
  policy: "security_critical",
});
