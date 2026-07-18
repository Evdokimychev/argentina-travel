import "server-only";

import { cookies, headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InteractionActor } from "@/lib/personalization/interactions-server";

const SEARCH_CRAWLER_UA =
  /googlebot|bingbot|yandexbot|yandeximages|yandexrenderresourcesbot|duckduckbot|baiduspider|slurp|facebookexternalhit|twitterbot|robo/i;

function isSearchCrawler(userAgent: string): boolean {
  return SEARCH_CRAWLER_UA.test(userAgent);
}

export function hasSupabaseAuthSessionCookie(
  requestCookies: ReadonlyArray<{ name: string }>,
): boolean {
  return requestCookies.some(
    ({ name }) => name.startsWith("sb-") && name.includes("-auth-token"),
  );
}

export async function resolveInteractionActor(): Promise<InteractionActor> {
  try {
    const requestHeaders = await headers();
    const userAgent = requestHeaders.get("user-agent") ?? "";
    if (isSearchCrawler(userAgent)) {
      return { anonymousId: null };
    }
  } catch {
    // вне request context — продолжаем обычный путь
  }

  const cookieStore = await cookies();
  const anonymousId = cookieStore.get("pa_vid")?.value ?? null;

  // Supabase getUser() is a remote verification call. Anonymous visitors have
  // no auth-token cookie, so they can safely skip that network round trip.
  if (!hasSupabaseAuthSessionCookie(cookieStore.getAll())) {
    return { anonymousId };
  }

  let userId: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  if (userId) {
    return { userId };
  }

  return { anonymousId };
}
