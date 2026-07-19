import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveSiteGlobalForLocale } from "@/lib/cms/site-globals/locale-resolve";
import {
  DEFAULT_SITE_BRANDING,
  normalizeSiteBranding,
  normalizeSiteBlog,
  normalizeSiteCommerce,
  normalizeSiteContact,
  normalizeSiteDesign,
  normalizeSiteFeatures,
  normalizeSiteLegal,
  normalizeSiteMaintenance,
  normalizeSiteModules,
  normalizeSiteForms,
  normalizeSiteEmail,
  normalizeSiteMarketing,
  normalizeSiteNavigation,
  normalizeSiteSeo,
} from "@/lib/cms/site-globals/normalize";
import { DEFAULT_I18N_LOCALE, type I18nLocale } from "@/lib/i18n/config";
import type { Json } from "@/types/database";
import type {
  SiteBrandingGlobal,
  SiteBrandingGlobalResolved,
  SiteContactGlobal,
  SiteContactGlobalResolved,
  SiteBlogGlobal,
  SiteCommerceGlobal,
  SiteDesignGlobal,
  SiteFeaturesGlobal,
  SiteGlobalKey,
  SiteGlobalLocaleOverrides,
  SiteLegalGlobal,
  SiteLegalGlobalResolved,
  SiteMaintenanceGlobal,
  SiteMaintenanceGlobalResolved,
  SiteModulesGlobal,
  SiteFormsGlobal,
  SiteEmailGlobal,
  SiteMarketingGlobal,
  SiteNavigationGlobal,
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

export async function fetchSiteNavigation(): Promise<SiteNavigationGlobal> {
  const cached = readCache<SiteNavigationGlobal>("site.navigation");
  if (cached) return cached;
  const parsed = normalizeSiteNavigation(await loadSettingsKey("site.navigation"));
  writeCache("site.navigation", parsed);
  return parsed;
}

export async function fetchSiteDesign(): Promise<SiteDesignGlobal> {
  const cached = readCache<SiteDesignGlobal>("site.design");
  if (cached) return cached;
  const parsed = normalizeSiteDesign(await loadSettingsKey("site.design"));
  writeCache("site.design", parsed);
  return parsed;
}

export async function fetchSiteBlog(): Promise<SiteBlogGlobal> {
  const cached = readCache<SiteBlogGlobal>("site.blog");
  if (cached) return cached;
  const parsed = normalizeSiteBlog(await loadSettingsKey("site.blog"));
  writeCache("site.blog", parsed);
  return parsed;
}

export async function fetchSiteCommerce(): Promise<SiteCommerceGlobal> {
  const cached = readCache<SiteCommerceGlobal>("site.commerce");
  if (cached) return cached;
  const parsed = normalizeSiteCommerce(await loadSettingsKey("site.commerce"));
  writeCache("site.commerce", parsed);
  return parsed;
}

export async function fetchSiteModules(): Promise<SiteModulesGlobal> {
  const cached = readCache<SiteModulesGlobal>("site.modules");
  if (cached) return cached;
  const parsed = normalizeSiteModules(await loadSettingsKey("site.modules"));
  writeCache("site.modules", parsed);
  return parsed;
}

export async function fetchSiteForms(): Promise<SiteFormsGlobal> {
  const cached = readCache<SiteFormsGlobal>("site.forms");
  if (cached) return cached;
  const parsed = normalizeSiteForms(await loadSettingsKey("site.forms"));
  writeCache("site.forms", parsed);
  return parsed;
}

export async function fetchSiteEmail(): Promise<SiteEmailGlobal> {
  const cached = readCache<SiteEmailGlobal>("site.email");
  if (cached) return cached;
  const parsed = normalizeSiteEmail(await loadSettingsKey("site.email"));
  writeCache("site.email", parsed);
  return parsed;
}

export async function fetchSiteMarketing(): Promise<SiteMarketingGlobal> {
  const cached = readCache<SiteMarketingGlobal>("site.marketing");
  if (cached) return cached;
  const parsed = normalizeSiteMarketing(await loadSettingsKey("site.marketing"));
  writeCache("site.marketing", parsed);
  return parsed;
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
    "site.navigation": normalizeSiteNavigation(settings["site.navigation"]) as unknown as Json,
    "site.design": normalizeSiteDesign(settings["site.design"]) as unknown as Json,
    "site.blog": normalizeSiteBlog(settings["site.blog"]) as unknown as Json,
    "site.commerce": normalizeSiteCommerce(settings["site.commerce"]) as unknown as Json,
    "site.modules": normalizeSiteModules(settings["site.modules"]) as unknown as Json,
    "site.forms": normalizeSiteForms(settings["site.forms"]) as unknown as Json,
    "site.email": normalizeSiteEmail(settings["site.email"]) as unknown as Json,
    "site.marketing": normalizeSiteMarketing(settings["site.marketing"]) as unknown as Json,
    "site.maintenance": normalizeSiteMaintenance(settings["site.maintenance"]) as unknown as Json,
  };
}

export function invalidateSiteGlobal(key: SiteGlobalKey): void {
  invalidateSiteGlobalCache(key);
  if (key === "site.features") invalidateSiteFeaturesCache();
  if (key === "site.legal") invalidateSiteLegalCache();
}
