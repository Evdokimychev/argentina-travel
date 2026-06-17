import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { profileToSessionUser } from "@/lib/profile-mapper";
import { userHasAccountRole } from "@/types/user";
import type { AccountRole } from "@/types/user";

export async function POST(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Supabase auth disabled" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      role?: AccountRole;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const role = body.role ?? "tourist";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Укажите корректный email" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "Введите пароль" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("*")
      .ilike("email", email)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Неверный email или пароль", code: "INVALID_CREDENTIALS" },
        { status: 401 }
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

    const supabase = await createSupabaseServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: "Неверный email или пароль", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    if (profile.active_role !== role) {
      await supabase.from("profiles").update({ active_role: role }).eq("id", profile.id);
    }

    const user = profileToSessionUser(
      { ...profile, active_role: role },
      role
    );

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
