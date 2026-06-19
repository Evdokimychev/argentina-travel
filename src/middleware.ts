import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import type { Database } from "@/types/database";

function createSupabaseMiddlewareClient(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

function redirectToSignIn(request: NextRequest, pathname: string, extra?: Record<string, string>) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/";
  redirectUrl.searchParams.set("auth", "sign-in");
  redirectUrl.searchParams.set("next", pathname);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      redirectUrl.searchParams.set(key, value);
    }
  }
  return NextResponse.redirect(redirectUrl);
}

export async function middleware(request: NextRequest) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const isProfile = pathname.startsWith("/profile");
  const isOrganizer = pathname.startsWith("/organizer");
  const isAdmin = pathname.startsWith("/admin");

  if (!isProfile && !isOrganizer && !isAdmin) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    if (process.env.NODE_ENV === "production") {
      return redirectToSignIn(request, pathname, { error: "auth-unavailable" });
    }
    return response;
  }

  const supabase = createSupabaseMiddlewareClient(request, response);
  if (!supabase) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const extra: Record<string, string> = {};
    if (isOrganizer) extra.role = "organizer";
    if (isAdmin) extra.role = "admin";
    return redirectToSignIn(request, pathname, extra);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("roles, is_blocked")
    .eq("id", user.id)
    .maybeSingle();

  let roles = profile?.roles ?? [];
  let blocked = profile?.is_blocked ?? false;

  if (profileError) {
    const { data: fallbackProfile } = await supabase
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .maybeSingle();
    roles = fallbackProfile?.roles ?? [];
    blocked = false;
  }

  if (blocked) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set("error", "account-blocked");
    return NextResponse.redirect(redirectUrl);
  }

  if (isOrganizer && !roles.includes("organizer")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/join";
    redirectUrl.searchParams.set("reason", "organizer-required");
    return NextResponse.redirect(redirectUrl);
  }

  if (isAdmin && !roles.includes("admin")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set("error", "admin-required");
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/profile/:path*", "/organizer/:path*", "/admin/:path*"],
};
