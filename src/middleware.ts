import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { LOCALE_COOKIE_KEY } from "@/lib/i18n/config";
import { getLocaleFromPathname, stripLocalePrefix } from "@/lib/i18n/locale-path";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { fetchSiteFeatures } from "@/lib/site-settings-server";
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

function isProtectedCabinetPath(pathname: string): boolean {
  return (
    pathname.startsWith("/profile") ||
    pathname.startsWith("/organizer") ||
    pathname.startsWith("/admin")
  );
}

function isMaintenanceExempt(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname === "/maintenance";
}

/** Optional /es/ and /en/ prefixes rewrite to unprefixed routes; cookie stores preference. */
function applyLocalePrefix(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  const localeFromPath = getLocaleFromPathname(pathname);
  if (!localeFromPath) return null;

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = stripLocalePrefix(pathname);

  const response = NextResponse.rewrite(rewriteUrl);
  response.cookies.set(LOCALE_COOKIE_KEY, localeFromPath, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const routePathname = stripLocalePrefix(pathname);

  if (request.method === "POST" && pathname.startsWith("/api/webhooks/")) {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`webhooks:ip:${ip}`, 120, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Слишком много webhook-запросов. Повторите позже." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
      );
    }
  }

  if (!isMaintenanceExempt(routePathname)) {
    try {
      const features = await fetchSiteFeatures();
      if (features.maintenanceMode) {
        return NextResponse.redirect(new URL("/maintenance", request.url));
      }
    } catch {
      // Settings unavailable — do not block public site
    }
  }

  const localeResponse = applyLocalePrefix(request);
  const isProtected = isProtectedCabinetPath(routePathname);

  if (!isSupabaseAuthEnabled() || !isProtected) {
    return localeResponse ?? NextResponse.next();
  }

  const isOrganizer = routePathname.startsWith("/organizer");
  const isAdmin = routePathname.startsWith("/admin");

  const response =
    localeResponse ??
    NextResponse.next({
      request: { headers: request.headers },
    });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    if (process.env.NODE_ENV === "production") {
      return redirectToSignIn(request, routePathname, { error: "auth-unavailable" });
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
    return redirectToSignIn(request, routePathname, extra);
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
