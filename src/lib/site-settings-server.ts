import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_SITE_BRANDING,
  DEFAULT_SITE_CONTACT,
  DEFAULT_SITE_FEATURES,
  DEFAULT_SITE_SEO,
  normalizeSiteBranding,
  normalizeSiteContact,
  normalizeSiteFeatures,
  normalizeSiteLegal,
  normalizeSiteSeo,
} from "@/lib/cms/site-globals/normalize";
import type { Json } from "@/types/database";
import type {
  SiteBrandingGlobal,
  SiteContactGlobal,
  SiteFeaturesGlobal,
  SiteGlobalKey,
  SiteLegalGlobal,
  SiteSeoGlobal,
} from "@/types/site-globals";

export type { SiteFeaturesGlobal as SiteFeatures, SiteLegalGlobal as SiteLegal };

const CACHE_TTL_MS = 60_000;

type CacheEntry<T> = { value: T; at: number };

const cache: Partial<Record<SiteGlobalKey, CacheEntry<unknown>>> = {};

async function loadSettingsKey(key: string): Promise<Json | undefined> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    return data?.value;
  } catch {
    return undefined;
  }
}

function readCache<T>(key: SiteGlobalKey): T | null {
  const entry = cache[key] as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.at >= CACHE_TTL_MS) return null;
  return entry.value;
}

function writeCache<T>(key: SiteGlobalKey, value: T): void {
  cache[key] = { value, at: Date.now() };
}

export function invalidateSiteGlobalCache(key?: SiteGlobalKey): void {
  if (key) {
    delete cache[key];
    return;
  }
  for (const k of Object.keys(cache)) {
    delete cache[k as SiteGlobalKey];
  }
}

export function invalidateSiteFeaturesCache(): void {
  invalidateSiteGlobalCache("site.features");
}

export function invalidateSiteLegalCache(): void {
  invalidateSiteGlobalCache("site.legal");
}

export async function fetchSiteFeatures(): Promise<SiteFeaturesGlobal> {
  const cached = readCache<SiteFeaturesGlobal>("site.features");
  if (cached) return cached;
  const parsed = normalizeSiteFeatures(await loadSettingsKey("site.features"));
  writeCache("site.features", parsed);
  return parsed;
}

export async function fetchSiteLegal(): Promise<SiteLegalGlobal> {
  const cached = readCache<SiteLegalGlobal>("site.legal");
  if (cached) return cached;
  const parsed = normalizeSiteLegal(await loadSettingsKey("site.legal"));
  writeCache("site.legal", parsed);
  return parsed;
}

export async function fetchSiteBranding(): Promise<SiteBrandingGlobal> {
  const cached = readCache<SiteBrandingGlobal>("site.branding");
  if (cached) return cached;
  const parsed = normalizeSiteBranding(await loadSettingsKey("site.branding"));
  writeCache("site.branding", parsed);
  return parsed;
}

export async function fetchSiteSeo(): Promise<SiteSeoGlobal> {
  const cached = readCache<SiteSeoGlobal>("site.seo");
  if (cached) return cached;
  const parsed = normalizeSiteSeo(await loadSettingsKey("site.seo"));
  writeCache("site.seo", parsed);
  return parsed;
}

export async function fetchSiteContact(): Promise<SiteContactGlobal> {
  const cached = readCache<SiteContactGlobal>("site.contact");
  if (cached) return cached;
  const parsed = normalizeSiteContact(await loadSettingsKey("site.contact"));
  writeCache("site.contact", parsed);
  return parsed;
}

/** Combined read for layout metadata. */
export async function fetchSitePublicMeta(): Promise<{
  branding: SiteBrandingGlobal;
  seo: SiteSeoGlobal;
}> {
  const [branding, seo] = await Promise.all([fetchSiteBranding(), fetchSiteSeo()]);
  return { branding, seo };
}

export async function getSiteBrandName(): Promise<string> {
  const branding = await fetchSiteBranding();
  return branding.siteName || DEFAULT_SITE_BRANDING.siteName;
}

export async function fetchAllSiteGlobalsForAdmin(): Promise<Record<SiteGlobalKey, Json>> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("site_settings").select("key, value, updated_at");

  const settings: Record<string, Json> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return {
    "site.legal": normalizeSiteLegal(settings["site.legal"]) as unknown as Json,
    "site.features": normalizeSiteFeatures(settings["site.features"]) as unknown as Json,
    "site.branding": normalizeSiteBranding(settings["site.branding"]) as unknown as Json,
    "site.seo": normalizeSiteSeo(settings["site.seo"]) as unknown as Json,
    "site.contact": normalizeSiteContact(settings["site.contact"]) as unknown as Json,
  };
}

export function invalidateSiteGlobal(key: SiteGlobalKey): void {
  invalidateSiteGlobalCache(key);
  if (key === "site.features") invalidateSiteFeaturesCache();
  if (key === "site.legal") invalidateSiteLegalCache();
}
