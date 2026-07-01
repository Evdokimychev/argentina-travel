import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveSiteGlobalForLocale } from "@/lib/cms/site-globals/locale-resolve";
import {
  DEFAULT_SITE_BRANDING,
  normalizeSiteBranding,
  normalizeSiteContact,
  normalizeSiteFeatures,
  normalizeSiteLegal,
  normalizeSiteMaintenance,
  normalizeSiteSeo,
} from "@/lib/cms/site-globals/normalize";
import { DEFAULT_I18N_LOCALE, type I18nLocale } from "@/lib/i18n/config";
import type { Json } from "@/types/database";
import type {
  SiteBrandingGlobal,
  SiteBrandingGlobalResolved,
  SiteContactGlobal,
  SiteContactGlobalResolved,
  SiteFeaturesGlobal,
  SiteGlobalKey,
  SiteGlobalLocaleOverrides,
  SiteLegalGlobal,
  SiteLegalGlobalResolved,
  SiteMaintenanceGlobal,
  SiteMaintenanceGlobalResolved,
  SiteSeoGlobal,
  SiteSeoGlobalResolved,
} from "@/types/site-globals";

export type { SiteFeaturesGlobal as SiteFeatures, SiteLegalGlobalResolved as SiteLegal };

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

function resolveStoredGlobal<T extends Record<string, unknown>>(
  stored: T & { locales?: SiteGlobalLocaleOverrides<Partial<T>> },
  locale: I18nLocale = DEFAULT_I18N_LOCALE,
): T {
  const { locales, ...base } = stored;
  return resolveSiteGlobalForLocale(base as T, locales, locale);
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

export async function fetchSiteLegal(locale?: I18nLocale): Promise<SiteLegalGlobalResolved> {
  const cached = readCache<SiteLegalGlobal>("site.legal");
  const stored = cached ?? normalizeSiteLegal(await loadSettingsKey("site.legal"));
  if (!cached) writeCache("site.legal", stored);
  return resolveStoredGlobal(stored, locale);
}

export async function fetchSiteBranding(locale?: I18nLocale): Promise<SiteBrandingGlobalResolved> {
  const cached = readCache<SiteBrandingGlobal>("site.branding");
  const stored = cached ?? normalizeSiteBranding(await loadSettingsKey("site.branding"));
  if (!cached) writeCache("site.branding", stored);
  return resolveStoredGlobal(stored, locale);
}

export async function fetchSiteSeo(locale?: I18nLocale): Promise<SiteSeoGlobalResolved> {
  const cached = readCache<SiteSeoGlobal>("site.seo");
  const stored = cached ?? normalizeSiteSeo(await loadSettingsKey("site.seo"));
  if (!cached) writeCache("site.seo", stored);
  return resolveStoredGlobal(stored, locale);
}

export async function fetchSiteContact(locale?: I18nLocale): Promise<SiteContactGlobalResolved> {
  const cached = readCache<SiteContactGlobal>("site.contact");
  const stored = cached ?? normalizeSiteContact(await loadSettingsKey("site.contact"));
  if (!cached) writeCache("site.contact", stored);
  return resolveStoredGlobal(stored, locale);
}

export async function fetchSiteMaintenance(locale?: I18nLocale): Promise<SiteMaintenanceGlobalResolved> {
  const cached = readCache<SiteMaintenanceGlobal>("site.maintenance");
  const stored = cached ?? normalizeSiteMaintenance(await loadSettingsKey("site.maintenance"));
  if (!cached) writeCache("site.maintenance", stored);
  return resolveStoredGlobal(stored, locale);
}

/** Combined read for layout metadata. */
export async function fetchSitePublicMeta(locale?: I18nLocale): Promise<{
  branding: SiteBrandingGlobalResolved;
  seo: SiteSeoGlobalResolved;
}> {
  const [branding, seo] = await Promise.all([
    fetchSiteBranding(locale),
    fetchSiteSeo(locale),
  ]);
  return { branding, seo };
}

export async function getSiteBrandName(locale?: I18nLocale): Promise<string> {
  const branding = await fetchSiteBranding(locale);
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
    "site.maintenance": normalizeSiteMaintenance(settings["site.maintenance"]) as unknown as Json,
  };
}

export function invalidateSiteGlobal(key: SiteGlobalKey): void {
  invalidateSiteGlobalCache(key);
  if (key === "site.features") invalidateSiteFeaturesCache();
  if (key === "site.legal") invalidateSiteLegalCache();
}
