import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import type { Database } from "@/types/database";

export async function middleware(request: NextRequest) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname.startsWith("/profile") || pathname.startsWith("/organizer");

  if (!isProtected) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    if (process.env.NODE_ENV === "production") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.searchParams.set("auth", "sign-in");
      redirectUrl.searchParams.set("error", "auth-unavailable");
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set("auth", "sign-in");
    redirectUrl.searchParams.set("next", pathname);
    if (pathname.startsWith("/organizer")) {
      redirectUrl.searchParams.set("role", "organizer");
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith("/organizer")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .maybeSingle();

    const roles = profile?.roles ?? [];
    if (!roles.includes("organizer")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/join";
      redirectUrl.searchParams.set("reason", "organizer-required");
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/profile/:path*", "/organizer/:path*"],
};
