import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { normalizePhone } from "@/lib/auth-store";
import { DEMO_PASSWORD } from "@/lib/auth-store";
import { userHasAccountRole } from "@/types/user";
import type { AccountRole } from "@/types/user";

export async function POST(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Supabase auth disabled" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { phone?: string; role?: AccountRole };
    const role = body.role ?? "tourist";
    const normalized = normalizePhone(body.phone ?? "");

    if (!normalized) {
      return NextResponse.json({ error: "Введите корректный номер телефона" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("*")
      .eq("phone", normalized)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "NOT_FOUND", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (
      !userHasAccountRole(
        { role: profile.active_role as AccountRole, roles: profile.roles as AccountRole[] },
        role
      )
    ) {
      return NextResponse.json(
        {
          error: role === "organizer" ? "ROLE_NOT_CONNECTED" : "WRONG_ROLE",
          code: role === "organizer" ? "ROLE_NOT_CONNECTED" : "WRONG_ROLE",
        },
        { status: 403 }
      );
    }

    const email = profile.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "У аккаунта не указан email" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: DEMO_PASSWORD,
    });

    if (signInError) {
      return NextResponse.json(
        {
          error:
            "Для этого аккаунта нужен вход по email и паролю. Телефонный вход доступен для демо-пароля.",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    if (profile.active_role !== role) {
      await supabase.from("profiles").update({ active_role: role }).eq("id", profile.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
