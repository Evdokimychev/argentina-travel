import { normalizeSiteFeatures } from "@/lib/cms/site-globals/normalize";
import type { SiteFeaturesGlobal } from "@/types/site-globals";

const CACHE_TTL_MS = 60_000;
let cached: { value: SiteFeaturesGlobal; at: number } | null = null;

/** Edge-safe maintenance settings read used by middleware. */
export async function fetchSiteFeaturesEdge(): Promise<SiteFeaturesGlobal> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const token =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!baseUrl || !token) return normalizeSiteFeatures(undefined);

  try {
    const url = new URL("/rest/v1/site_settings", baseUrl);
    url.searchParams.set("select", "value");
    url.searchParams.set("key", "eq.site.features");
    url.searchParams.set("limit", "1");
    const response = await fetch(url, {
      headers: { apikey: token, Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return normalizeSiteFeatures(undefined);
    const rows = (await response.json()) as Array<{ value?: unknown }>;
    const value = normalizeSiteFeatures(rows[0]?.value);
    cached = { value, at: Date.now() };
    return value;
  } catch {
    return normalizeSiteFeatures(undefined);
  }
}
