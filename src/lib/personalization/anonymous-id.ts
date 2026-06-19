"use client";

const ANONYMOUS_ID_KEY = "pa-anonymous-id";
const ANONYMOUS_ID_COOKIE = "pa_vid";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `anon-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = window.sessionStorage.getItem(ANONYMOUS_ID_KEY);
    if (existing) return existing;

    const fromCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${ANONYMOUS_ID_COOKIE}=`))
      ?.split("=")[1];
    if (fromCookie) {
      window.sessionStorage.setItem(ANONYMOUS_ID_KEY, fromCookie);
      return fromCookie;
    }

    const id = randomId();
    window.sessionStorage.setItem(ANONYMOUS_ID_KEY, id);
    return id;
  } catch {
    return randomId();
  }
}

export function persistAnonymousIdCookie(id: string): void {
  if (typeof document === "undefined" || !id) return;
  const maxAge = 60 * 60 * 24 * 90;
  document.cookie = `${ANONYMOUS_ID_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function readAnonymousIdFromCookieHeader(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ANONYMOUS_ID_COOKIE}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(ANONYMOUS_ID_COOKIE.length + 1));
  } catch {
    return null;
  }
}
