import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/auth-input";
import { profileToSessionUser } from "@/lib/profile-mapper";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AccountRole } from "@/types/user";

const INVALID_RESPONSE = { error: "INVALID_CREDENTIALS", code: "INVALID_CREDENTIALS" };

async function postSignInPhone(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    phone?: unknown;
    password?: unknown;
    role?: unknown;
  } | null;
  const phone = normalizePhone(typeof body?.phone === "string" ? body.phone : "");
  const password = typeof body?.password === "string" ? body.password : "";
  const role: AccountRole = body?.role === "organizer" ? "organizer" : "tourist";
  if (!phone || !password) return NextResponse.json(INVALID_RESPONSE, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  const email = profile?.email?.trim().toLowerCase() ?? `unknown-${phone.slice(-4)}@invalid.local`;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user || !profile || profile.id !== data.user.id || profile.is_blocked) {
    if (data.session) await supabase.auth.signOut({ scope: "local" });
    return NextResponse.json(INVALID_RESPONSE, { status: 401 });
  }

  const roles = profile.roles ?? [];
  if (!roles.includes(role)) {
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.json(
      { error: "ROLE_NOT_CONNECTED", code: "ROLE_NOT_CONNECTED" },
      { status: 403 },
    );
  }

  const { data: updated, error: updateError } = await admin
    .from("profiles")
    .update({ active_role: role })
    .eq("id", profile.id)
    .select("*")
    .single();
  if (updateError || !updated) {
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.json({ error: "Не удалось открыть профиль" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, user: profileToSessionUser(updated, role) });
}

export const POST = withRateLimit(postSignInPhone, {
  limit: 8,
  window: 300_000,
  keyPrefix: "auth:sign-in-phone",
  key: (request) => `ip:${getClientIp(request)}`,
  message: "Слишком много попыток. Попробуйте позже.",
  policy: "security_critical",
});
