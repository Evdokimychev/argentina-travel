import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { AUTH_CONFIRM_TYPES, RECOVERY_FLOW_COOKIE, resolveSafeAuthNext } from "@/lib/auth-flow";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authRedirectUrl } from "@/lib/site-url";

function authErrorResponse(requestUrl: string) {
  return NextResponse.redirect(authRedirectUrl("/auth/error?reason=expired-link", requestUrl));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const code = url.searchParams.get("code");
  const rawType = url.searchParams.get("type");
  const type = rawType && AUTH_CONFIRM_TYPES.has(rawType as EmailOtpType)
    ? (rawType as EmailOtpType)
    : null;

  if ((!tokenHash || !type) && !code) return authErrorResponse(request.url);

  const supabase = await createSupabaseServerClient();
  const result = tokenHash && type
    ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    : await supabase.auth.exchangeCodeForSession(code!);

  if (result.error) return authErrorResponse(request.url);

  const isRecovery = type === "recovery" || url.searchParams.get("next") === "/account/update-password";
  const next = resolveSafeAuthNext(url.searchParams.get("next"), isRecovery ? "recovery" : type);
  const response = NextResponse.redirect(authRedirectUrl(next, request.url));

  if (isRecovery) {
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
