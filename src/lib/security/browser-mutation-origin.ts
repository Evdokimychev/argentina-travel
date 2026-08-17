/**
 * Cookie-session CSRF strategy for mutating browser requests.
 *
 * Primary control: auth cookies use SameSite=Lax (middleware + client setters),
 * so classic cross-site POSTs do not attach the session cookie.
 *
 * Defense in depth for admin/session cookie mutations:
 * - Reject clearly cross-site Sec-Fetch-Site
 * - Reject Origin that does not match the request URL origin
 * - Allow missing Origin/Sec-Fetch-Site (non-browser clients, unit tests,
 *   automation Bearer paths that never reach this helper)
 */

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export type BrowserMutationOriginResult =
  | { ok: true; reason: "not_mutating" | "same_origin" | "same_site" | "no_browser_signals" }
  | { ok: false; reason: "cross_site" | "origin_mismatch" };

export function isMutatingHttpMethod(method: string): boolean {
  return MUTATING_METHODS.has(method.toUpperCase());
}

function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Evaluate Origin / Sec-Fetch-Site for a cookie-authenticated mutation.
 * Does not read cookies; callers apply this only on session paths.
 */
export function evaluateBrowserMutationOrigin(request: Request): BrowserMutationOriginResult {
  if (!isMutatingHttpMethod(request.method)) {
    return { ok: true, reason: "not_mutating" };
  }

  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase() ?? "";
  if (fetchSite === "cross-site") {
    return { ok: false, reason: "cross_site" };
  }
  if (fetchSite === "same-origin" || fetchSite === "same-site" || fetchSite === "none") {
    return { ok: true, reason: fetchSite === "none" ? "no_browser_signals" : "same_site" };
  }

  const requestOrigin = normalizeOrigin(request.url);
  const headerOrigin = normalizeOrigin(request.headers.get("origin"));
  if (headerOrigin && requestOrigin && headerOrigin !== requestOrigin) {
    return { ok: false, reason: "origin_mismatch" };
  }
  if (headerOrigin && requestOrigin && headerOrigin === requestOrigin) {
    return { ok: true, reason: "same_origin" };
  }

  return { ok: true, reason: "no_browser_signals" };
}
