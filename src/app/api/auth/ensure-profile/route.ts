import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { profileToSessionUser } from "@/lib/profile-mapper";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";
import type { AccountRole } from "@/types/user";

/** Создаёт профиль для текущей auth-сессии, если триггер signup его не создал. */
async function postEnsureProfile() {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Supabase auth disabled" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();
    const { data: existing } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        ok: true,
        user: profileToSessionUser(existing),
      });
    }

    const metadata = user.user_metadata ?? {};
    const roleText = typeof metadata.role === "string" ? metadata.role : "tourist";
    const profileRoles: AccountRole[] =
      roleText === "organizer" ? ["tourist", "organizer"] : ["tourist"];

    const email = (user.email ?? metadata.email ?? "").toString().trim().toLowerCase();

    const { data: created, error: insertError } = await admin
      .from("profiles")
      .insert({
        id: user.id,
        email,
        first_name: typeof metadata.first_name === "string" ? metadata.first_name : "",
        last_name: typeof metadata.last_name === "string" ? metadata.last_name : "",
        phone: typeof metadata.phone === "string" ? metadata.phone : null,
        roles: profileRoles,
        active_role: roleText === "organizer" ? "organizer" : "tourist",
        country: typeof metadata.country === "string" ? metadata.country : "Россия",
      })
      .select("*")
      .single();

    if (insertError || !created) {
      return NextResponse.json(
        { error: insertError?.message ?? "Не удалось создать профиль" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: profileToSessionUser(created),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(postEnsureProfile, {
  limit: 30,
  window: 60_000,
  keyPrefix: "auth:ensure-profile",
  key: (request) => `ip:${getClientIp(request)}`,
  message: "Слишком много запросов. Повторите позже.",
});
