import { matchContentPlanRedirect } from "@/data/content-plan-url-redirects";
import type { UrlRedirectStatusCode } from "@/types/url-redirect";

const CACHE_TTL_MS = 60_000;
const ALLOWED_STATUS = new Set<number>([301, 302, 307, 308]);

type RedirectMatch = { toPath: string; statusCode: UrlRedirectStatusCode };

let cache: { map: Map<string, RedirectMatch>; at: number } | null = null;

function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.replace(/\/+$/, "")
    : pathname;
}

function normalizeStatusCode(value: unknown): UrlRedirectStatusCode {
  const status = typeof value === "number" ? value : Number(value);
  return ALLOWED_STATUS.has(status) ? (status as UrlRedirectStatusCode) : 301;
}

async function loadActiveRedirectsMap(): Promise<Map<string, RedirectMatch>> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.map;

  const map = new Map<string, RedirectMatch>();
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const token =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!baseUrl || !token) return map;

  try {
    const url = new URL("/rest/v1/url_redirects", baseUrl);
    url.searchParams.set("select", "from_path,to_path,status_code");
    url.searchParams.set("enabled", "eq.true");
    url.searchParams.set("limit", "2000");
    const response = await fetch(url, {
      headers: { apikey: token, Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return map;

    const rows = (await response.json()) as Array<{
      from_path?: unknown;
      to_path?: unknown;
      status_code?: unknown;
    }>;
    for (const row of rows) {
      if (typeof row.from_path !== "string" || typeof row.to_path !== "string") continue;
      map.set(row.from_path, {
        toPath: row.to_path,
        statusCode: normalizeStatusCode(row.status_code),
      });
    }
    cache = { map, at: Date.now() };
  } catch {
    return map;
  }

  return map;
}

/** Edge-safe redirect lookup used by middleware. */
export async function matchUrlRedirectEdge(pathname: string): Promise<RedirectMatch | null> {
  const normalized = normalizePath(pathname);
  const staticTarget = matchContentPlanRedirect(normalized);
  if (staticTarget) return { toPath: staticTarget, statusCode: 301 };

  const map = await loadActiveRedirectsMap();
  return map.get(normalized) ?? null;
}
