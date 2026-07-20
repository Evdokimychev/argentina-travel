import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchSiteControlPlaneEdge } from "@/lib/site-settings-edge";
import { resolveSiteGlobalForLocale } from "@/lib/cms/site-globals/locale-resolve";
import {
  DEFAULT_SITE_BRANDING,
  DEFAULT_SITE_MODULES,
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
  SiteBrandingGlobalResolved,
  SiteContactGlobalResolved,
  SiteBlogGlobal,
  SiteCommerceGlobal,
  SiteDesignGlobal,
  SiteFeaturesGlobal,
  SiteGlobalKey,
  SiteGlobalLocaleOverrides,
  SiteLegalGlobalResolved,
  SiteMaintenanceGlobalResolved,
  SiteModulesGlobal,
  SiteFormsGlobal,
  SiteEmailGlobal,
  SiteMarketingGlobal,
  SiteNavigationGlobal,
  SiteSeoGlobalResolved,
} from "@/types/site-globals";
import { SITE_GLOBAL_KEYS } from "@/types/site-globals";

export type { SiteFeaturesGlobal as SiteFeatures, SiteLegalGlobalResolved as SiteLegal };

const CACHE_TTL_MS = 60_000;
const FAILURE_BACKOFF_MS = 3_000;
const QUERY_TIMEOUT_MS = 1_500;

type SettingsSnapshot = Partial<Record<SiteGlobalKey, Json>>;
type SnapshotResult = { ok: true; values: SettingsSnapshot } | { ok: false };

let snapshotCache: { values: SettingsSnapshot; successAt: number } | null = null;
let snapshotInFlight: Promise<SnapshotResult> | null = null;
let retryAfter = 0;
let cacheGeneration = 0;

/**
 * Load the public shell settings in one request. On a transient failure we keep
 * the last successful CMS snapshot, but never turn cold defaults into a
 * minute-long success cache.
 */
async function loadSettingsSnapshot(): Promise<SnapshotResult> {
  const now = Date.now();
  if (snapshotCache && now - snapshotCache.successAt < CACHE_TTL_MS) {
    return { ok: true, values: snapshotCache.values };
  }
  if (now < retryAfter) {
    return snapshotCache
      ? { ok: true, values: snapshotCache.values }
      : { ok: false };
  }
  if (snapshotInFlight) return snapshotInFlight;

  const generation = cacheGeneration;
  const request = (async (): Promise<SnapshotResult> => {
    try {
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [...SITE_GLOBAL_KEYS])
        .abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS))
        .retry(false);

      if (error) throw error;

      const values: SettingsSnapshot = {};
      for (const row of data ?? []) {
        if (SITE_GLOBAL_KEYS.includes(row.key as SiteGlobalKey)) {
          values[row.key as SiteGlobalKey] = row.value;
        }
      }

      if (generation === cacheGeneration) {
        snapshotCache = { values, successAt: Date.now() };
        retryAfter = 0;
      }
      return { ok: true as const, values };
    } catch {
      if (generation === cacheGeneration) {
        retryAfter = Date.now() + FAILURE_BACKOFF_MS;
      }
      return snapshotCache
        ? { ok: true as const, values: snapshotCache.values }
        : { ok: false as const };
    }
  })();
  snapshotInFlight = request;
  void request.finally(() => {
    if (snapshotInFlight === request) snapshotInFlight = null;
  });

  return request;
}

async function loadSettingsKey(key: SiteGlobalKey): Promise<Json | undefined> {
  const result = await loadSettingsSnapshot();
  return result.ok ? result.values[key] : undefined;
}

function resolveStoredGlobal<T extends Record<string, unknown>>(
  stored: T & { locales?: SiteGlobalLocaleOverrides<Partial<T>> },
  locale: I18nLocale = DEFAULT_I18N_LOCALE,
): T {
  const { locales, ...base } = stored;
  return resolveSiteGlobalForLocale(base as T, locales, locale);
}

export function invalidateSiteGlobalCache(key?: SiteGlobalKey): void {
  void key;
  cacheGeneration += 1;
  snapshotCache = null;
  snapshotInFlight = null;
  retryAfter = 0;
}

export function invalidateSiteFeaturesCache(): void {
  invalidateSiteGlobalCache("site.features");
}

export function invalidateSiteLegalCache(): void {
  invalidateSiteGlobalCache("site.legal");
}

export async function fetchSiteFeatures(): Promise<SiteFeaturesGlobal> {
  return normalizeSiteFeatures(await loadSettingsKey("site.features"));
}

export async function fetchSiteLegal(locale?: I18nLocale): Promise<SiteLegalGlobalResolved> {
  const stored = normalizeSiteLegal(await loadSettingsKey("site.legal"));
  return resolveStoredGlobal(stored, locale);
}

export async function fetchSiteBranding(locale?: I18nLocale): Promise<SiteBrandingGlobalResolved> {
  const stored = normalizeSiteBranding(await loadSettingsKey("site.branding"));
  return resolveStoredGlobal(stored, locale);
}

export async function fetchSiteSeo(locale?: I18nLocale): Promise<SiteSeoGlobalResolved> {
  const stored = normalizeSiteSeo(await loadSettingsKey("site.seo"));
  return resolveStoredGlobal(stored, locale);
}

export async function fetchSiteContact(locale?: I18nLocale): Promise<SiteContactGlobalResolved> {
  const stored = normalizeSiteContact(await loadSettingsKey("site.contact"));
  return resolveStoredGlobal(stored, locale);
}

export async function fetchSiteNavigation(): Promise<SiteNavigationGlobal> {
  return normalizeSiteNavigation(await loadSettingsKey("site.navigation"));
}

export async function fetchSiteDesign(): Promise<SiteDesignGlobal> {
  return normalizeSiteDesign(await loadSettingsKey("site.design"));
}

export async function fetchSiteBlog(): Promise<SiteBlogGlobal> {
  return normalizeSiteBlog(await loadSettingsKey("site.blog"));
}

export async function fetchSiteCommerce(): Promise<SiteCommerceGlobal> {
  return normalizeSiteCommerce(await loadSettingsKey("site.commerce"));
}

export async function fetchSiteModules(): Promise<SiteModulesGlobal> {
  const result = await loadSettingsSnapshot();
  if (result.ok) return normalizeSiteModules(result.values["site.modules"]);

  // Match the edge control plane: established read-only sections may keep
  // their defaults, but travel modules must not expose links to routes whose
  // middleware and APIs fail closed while settings are unavailable.
  return {
    ...DEFAULT_SITE_MODULES,
    apartmentsMode: "disabled",
    carRentalMode: "disabled",
    transfersMode: "disabled",
    hotelsMode: "disabled",
    showApartmentsInServices: false,
    showCarRentalInServices: false,
    showTransfersInServices: false,
  };
}

export type SiteModuleControlSnapshot =
  | {
      ok: true;
      navigation: SiteNavigationGlobal;
      modules: SiteModulesGlobal;
    }
  | { ok: false };

/**
 * One fail-aware read for public API kill-switches. A cold database failure is
 * not converted to enabled defaults; a previously successful cached snapshot
 * remains usable across transient failures and is dropped by explicit settings
 * invalidation after an admin update.
 */
export async function fetchSiteModuleControlSnapshot(): Promise<SiteModuleControlSnapshot> {
  const result = await fetchSiteControlPlaneEdge();
  if (!result.ok) return { ok: false };

  return {
    ok: true,
    navigation: result.navigation,
    modules: result.modules,
  };
}

export async function fetchSiteForms(): Promise<SiteFormsGlobal> {
  return normalizeSiteForms(await loadSettingsKey("site.forms"));
}

export async function fetchSiteEmail(): Promise<SiteEmailGlobal> {
  return normalizeSiteEmail(await loadSettingsKey("site.email"));
}

export async function fetchSiteMarketing(): Promise<SiteMarketingGlobal> {
  return normalizeSiteMarketing(await loadSettingsKey("site.marketing"));
}

export async function fetchSiteMaintenance(locale?: I18nLocale): Promise<SiteMaintenanceGlobalResolved> {
  const stored = normalizeSiteMaintenance(await loadSettingsKey("site.maintenance"));
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
