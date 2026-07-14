const PRODUCTION_SITE_URL = "https://www.goargentina.ru";

function isProductionRuntime(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.DEPLOY_ENV === "production";
}

function normalizeConfiguredUrl(value: string): string {
  const parsed = new URL(value.trim());
  parsed.hash = "";
  parsed.search = "";
  return parsed.origin;
}

function isLocalDevelopmentUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function isNonCanonicalPublicHost(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return hostname.endsWith(".vercel.app") || hostname.endsWith(".local");
  } catch {
    return true;
  }
}

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) {
    if (isProductionRuntime()) {
      throw new Error("NEXT_PUBLIC_SITE_URL is required in production");
    }
    return PRODUCTION_SITE_URL;
  }

  let configured: string;
  try {
    configured = normalizeConfiguredUrl(raw);
  } catch {
    if (isProductionRuntime()) {
      throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute URL");
    }
    return PRODUCTION_SITE_URL;
  }

  if (isProductionRuntime()) {
    if (configured !== PRODUCTION_SITE_URL) {
      throw new Error(`NEXT_PUBLIC_SITE_URL must be ${PRODUCTION_SITE_URL} in production`);
    }
    return configured;
  }

  if (isLocalDevelopmentUrl(configured)) return configured;
  if (isNonCanonicalPublicHost(configured)) return PRODUCTION_SITE_URL;
  return configured;
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("//")) return `https:${path}`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

/** Auth redirects are canonical in production and localhost-only in development. */
export function authRedirectUrl(path: string, requestUrl?: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (isProductionRuntime() || !requestUrl) {
    return `${getSiteUrl()}${normalized}`;
  }

  const requestOrigin = new URL(requestUrl).origin;
  const origin = isLocalDevelopmentUrl(requestOrigin) ? requestOrigin : getSiteUrl();
  return `${origin}${normalized}`;
}

export function resolvePublicUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return absoluteUrl(url);
}

export const CANONICAL_PRODUCTION_SITE_URL = PRODUCTION_SITE_URL;
