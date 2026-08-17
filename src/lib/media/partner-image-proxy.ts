const YOUTRAVEL_IMAGE_HOSTS = new Set(["cf.youtravel.me"]);
const YOUTRAVEL_IMAGE_PATH = /^\/(?:public\/images|upload|images)\//i;
const MAX_REDIRECTS = 3;

export function isAllowedPartnerImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    if (url.hostname !== url.hostname.toLowerCase()) return false;
    // Reject IP literals and localhost even if somehow allowlisted later.
    if (
      url.hostname === "localhost" ||
      url.hostname.endsWith(".local") ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(url.hostname) ||
      url.hostname.includes(":")
    ) {
      return false;
    }
    return (
      YOUTRAVEL_IMAGE_HOSTS.has(url.hostname.toLowerCase()) &&
      YOUTRAVEL_IMAGE_PATH.test(url.pathname)
    );
  } catch {
    return false;
  }
}

/**
 * Resolve a partner image URL without following redirects to untrusted hosts.
 * Callers must stream/read the final Response body themselves.
 */
export async function fetchAllowedPartnerImage(
  sourceUrl: string,
  init: RequestInit = {},
): Promise<{ ok: true; response: Response; finalUrl: string } | { ok: false; reason: string }> {
  if (!isAllowedPartnerImageUrl(sourceUrl)) {
    return { ok: false, reason: "unsupported_source" };
  }

  let current = sourceUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!isAllowedPartnerImageUrl(current)) {
      return { ok: false, reason: "redirect_not_allowlisted" };
    }

    const response = await fetch(current, {
      ...init,
      redirect: "manual",
      cache: "no-store",
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return { ok: false, reason: "redirect_missing_location" };
      let nextUrl: string;
      try {
        nextUrl = new URL(location, current).toString();
      } catch {
        return { ok: false, reason: "redirect_invalid_location" };
      }
      current = nextUrl;
      continue;
    }

    if (!response.ok) {
      return { ok: false, reason: `http_${response.status}` };
    }

    const finalUrl = response.url && isAllowedPartnerImageUrl(response.url) ? response.url : current;
    if (!isAllowedPartnerImageUrl(finalUrl)) {
      return { ok: false, reason: "final_url_not_allowlisted" };
    }

    return { ok: true, response, finalUrl };
  }

  return { ok: false, reason: "too_many_redirects" };
}

export function buildPartnerImageProxyUrl(
  src: string,
  options: { width?: number; quality?: number } = {},
): string {
  if (!isAllowedPartnerImageUrl(src)) return src;

  const width = Math.min(1800, Math.max(160, Math.round(options.width ?? 1440)));
  const quality = Math.min(90, Math.max(55, Math.round(options.quality ?? 80)));

  // Prefer the partner CDN's own width transform. Original tour photos can be
  // several megabytes, which is especially expensive on mobile. Keeping the
  // transformation on the trusted source also avoids Vercel image/proxy quotas.
  if (process.env.NEXT_PUBLIC_PARTNER_IMAGE_PROXY !== "true") {
    const url = new URL(src);
    url.pathname = `/tr:w-${width}${url.pathname}`;
    return url.toString();
  }

  const params = new URLSearchParams({ src, w: String(width), q: String(quality) });
  return `/api/media/partner-image?${params.toString()}`;
}
