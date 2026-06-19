import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { normalizePhone } from "@/lib/auth-store";

/** Поиск email по телефону — без входа, только для клиентского signIn. */
export async function POST(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Supabase auth disabled" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { phone?: string };
    const normalized = normalizePhone(body.phone ?? "");

    if (!normalized) {
      return NextResponse.json({ error: "Введите корректный номер телефона" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("email, roles, active_role")
      .eq("phone", normalized)
      .maybeSingle();

    if (error || !profile?.email) {
      return NextResponse.json({ error: "NOT_FOUND", code: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      email: profile.email.trim().toLowerCase(),
      roles: profile.roles,
      activeRole: profile.active_role,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
