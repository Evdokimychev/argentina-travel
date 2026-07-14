import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authRedirectUrl } from "@/lib/site-url";

const ALLOWED_NEXT_PATHS = new Set(["/", "/profile", "/organizer", "/auth/reset-password"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = new URL(authRedirectUrl("/", request.url)).origin;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const safeNext = ALLOWED_NEXT_PATHS.has(next) ? next : "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }

    const errorUrl = new URL("/", origin);
    errorUrl.searchParams.set("auth", "sign-in");
    errorUrl.searchParams.set("error", "expired-link");
    return NextResponse.redirect(errorUrl);
  }

  const errorUrl = new URL("/", origin);
  errorUrl.searchParams.set("auth", "sign-in");
  errorUrl.searchParams.set("error", "expired-link");
  return NextResponse.redirect(errorUrl);
}
