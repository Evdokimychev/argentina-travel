import {
  normalizeSiteFeatures,
  normalizeSiteNavigation,
  normalizeSiteModules,
} from "@/lib/cms/site-globals/normalize";
import type { SiteFeaturesGlobal, SiteModulesGlobal, SiteNavigationGlobal } from "@/types/site-globals";

const CACHE_TTL_MS = 60_000;
let cached: { value: SiteFeaturesGlobal; at: number } | null = null;
let navigationCached: { value: SiteNavigationGlobal; at: number } | null = null;
let modulesCached: { value: SiteModulesGlobal; at: number } | null = null;

async function fetchEdgeSetting(key: string): Promise<unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const token =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!baseUrl || !token) return undefined;

  const url = new URL("/rest/v1/site_settings", baseUrl);
  url.searchParams.set("select", "value");
  url.searchParams.set("key", `eq.${key}`);
  url.searchParams.set("limit", "1");
  const response = await fetch(url, {
    headers: { apikey: token, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) return undefined;
  const rows = (await response.json()) as Array<{ value?: unknown }>;
  return rows[0]?.value;
}

/** Edge-safe maintenance settings read used by middleware. */
export async function fetchSiteFeaturesEdge(): Promise<SiteFeaturesGlobal> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  try {
    const value = normalizeSiteFeatures(await fetchEdgeSetting("site.features"));
    cached = { value, at: Date.now() };
    return value;
  } catch {
    return normalizeSiteFeatures(undefined);
  }
}

/** Edge-safe public module visibility read used by middleware. */
export async function fetchSiteNavigationEdge(): Promise<SiteNavigationGlobal> {
  if (navigationCached && Date.now() - navigationCached.at < CACHE_TTL_MS) {
    return navigationCached.value;
  }

  try {
    const value = normalizeSiteNavigation(await fetchEdgeSetting("site.navigation"));
    navigationCached = { value, at: Date.now() };
    return value;
  } catch {
    return normalizeSiteNavigation(undefined);
  }
}

export async function fetchSiteModulesEdge(): Promise<SiteModulesGlobal> {
  if (modulesCached && Date.now() - modulesCached.at < CACHE_TTL_MS) {
    return modulesCached.value;
  }
  try {
    const value = normalizeSiteModules(await fetchEdgeSetting("site.modules"));
    modulesCached = { value, at: Date.now() };
    return value;
  } catch {
    return normalizeSiteModules(undefined);
  }
}
