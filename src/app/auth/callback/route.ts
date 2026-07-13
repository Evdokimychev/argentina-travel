import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") ? next : "/";

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
