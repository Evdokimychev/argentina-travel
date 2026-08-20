import { NextResponse } from "next/server";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";

async function postLookupEmail(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@") || email.length > 254) {
    return NextResponse.json({ error: "Укажите корректный email" }, { status: 400 });
  }

  return NextResponse.json({ status: "continue" });
}

export const POST = withRateLimit(postLookupEmail, {
  limit: 8,
  window: 300_000,
  keyPrefix: "auth:lookup-email",
  key: (request) => `ip:${getClientIp(request)}`,
  message: "Слишком много попыток. Попробуйте позже.",
  policy: "security_critical",
});
