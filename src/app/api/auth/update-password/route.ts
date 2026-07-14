import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { RECOVERY_FLOW_COOKIE } from "@/lib/auth-flow";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get(RECOVERY_FLOW_COOKIE)?.value !== "active") {
    return NextResponse.json(
      { error: { code: "AUTH_RECOVERY_SESSION_REQUIRED", message: "Ссылка устарела. Запросите новое письмо." } },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < 8) {
    return NextResponse.json(
      { error: { code: "AUTH_PASSWORD_TOO_SHORT", message: "Пароль должен содержать не менее 8 символов." } },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json(
      { error: { code: "AUTH_RECOVERY_SESSION_REQUIRED", message: "Ссылка устарела. Запросите новое письмо." } },
      { status: 401 }
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return NextResponse.json(
      { error: { code: "AUTH_PASSWORD_UPDATE_FAILED", message: "Не удалось изменить пароль. Запросите новое письмо и попробуйте ещё раз." } },
      { status: 400 }
    );
  }

  await supabase.auth.signOut({ scope: "global" });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(RECOVERY_FLOW_COOKIE, "", { expires: new Date(0), path: "/" });
  return response;
}
