import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";

type EmailLookupStatus = "found" | "not_found" | "needs_repair" | "unconfirmed";

async function postLookupEmail(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@") || email.length > 254) {
    return NextResponse.json({ error: "Укажите корректный email" }, { status: 400 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (profileError) throw profileError;

    let status: EmailLookupStatus = "not_found";
    if (profile) {
      const { data, error } = await admin.auth.admin.getUserById(profile.id);
      if (error || !data.user) {
        status = "needs_repair";
      } else {
        status = data.user.email_confirmed_at ? "found" : "unconfirmed";
      }
    }

    console.info("[auth.lookup-email]", { status });
    return NextResponse.json({ status });
  } catch {
    return NextResponse.json(
      { error: "Не удалось проверить аккаунт. Попробуйте позже." },
      { status: 503 }
    );
  }
}

export const POST = withRateLimit(postLookupEmail, {
  limit: 8,
  window: 300_000,
  keyPrefix: "auth:lookup-email",
  key: (request) => `ip:${getClientIp(request)}`,
  message: "Слишком много попыток. Попробуйте позже.",
});
