import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authRedirectUrl } from "@/lib/site-url";
import { RECOVERY_FLOW_COOKIE } from "@/lib/auth-flow";

const ALLOWED_NEXT_PATHS = new Set(["/", "/profile", "/organizer", "/account/update-password"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = new URL(authRedirectUrl("/", request.url)).origin;
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/";
  const next = requestedNext === "/auth/reset-password" ? "/account/update-password" : requestedNext;
  const safeNext = ALLOWED_NEXT_PATHS.has(next) ? next : "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${safeNext}`);
      if (safeNext === "/account/update-password") {
        response.cookies.set(RECOVERY_FLOW_COOKIE, "active", {
          httpOnly: true,
          maxAge: 15 * 60,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }
      return response;
    }

    return NextResponse.redirect(new URL("/auth/error?reason=expired-link", origin));
  }

  return NextResponse.redirect(new URL("/auth/error?reason=expired-link", origin));
}
