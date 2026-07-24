import {
  DEFAULT_SITE_FEATURES,
  DEFAULT_SITE_MODULES,
  DEFAULT_SITE_NAVIGATION,
  normalizeSiteFeatures,
  normalizeSiteModules,
  normalizeSiteNavigation,
} from "@/lib/cms/site-globals/normalize";
import { applyPublicLaunchGuards } from "@/lib/cms/site-globals/public-launch-guards";
import type {
  SiteFeaturesGlobal,
  SiteModulesGlobal,
  SiteNavigationGlobal,
} from "@/types/site-globals";

const CACHE_TTL_MS = 60_000;
const FAILURE_BACKOFF_MS = 3_000;
const QUERY_TIMEOUT_MS = 1_000;

type ControlPlaneValues = {
  features: SiteFeaturesGlobal;
  navigation: SiteNavigationGlobal;
  modules: SiteModulesGlobal;
};

export type SiteControlPlaneEdgeSnapshot = ControlPlaneValues &
  (
    | {
        ok: true;
        source: "fresh" | "last_known_good";
        revision: number;
      }
    | {
        ok: false;
        source: "safe_fallback";
        revision: null;
      }
  );

type DurableSnapshot = ControlPlaneValues & {
  revision: number;
  fetchedAt: number;
};

let cached: DurableSnapshot | null = null;
let inFlight: Promise<SiteControlPlaneEdgeSnapshot> | null = null;
let retryAfter = 0;

const SAFE_FALLBACK_BASE_MODULES: SiteModulesGlobal = {
  ...DEFAULT_SITE_MODULES,
  apartmentsMode: "disabled",
  carRentalMode: "disabled",
  transfersMode: "disabled",
  hotelsMode: "disabled",
  showApartmentsInServices: false,
  showCarRentalInServices: false,
  showTransfersInServices: false,
};

const SAFE_FALLBACK_GUARDS = applyPublicLaunchGuards(
  { ...DEFAULT_SITE_NAVIGATION },
  SAFE_FALLBACK_BASE_MODULES,
);

const SAFE_FALLBACK: SiteControlPlaneEdgeSnapshot = {
  ok: false,
  source: "safe_fallback",
  revision: null,
  features: {
    ...DEFAULT_SITE_FEATURES,
    maintenanceMode: false,
    allowOrganizerSignup: false,
  },
  // Keep the established read-only site available during a cold settings
  // outage. New transactional modules remain disabled below, and every public
  // write independently requires an `ok: true` control-plane snapshot.
  navigation: SAFE_FALLBACK_GUARDS.navigation,
  modules: SAFE_FALLBACK_GUARDS.modules,
};

function lastKnownGood(): SiteControlPlaneEdgeSnapshot {
  if (!cached) return SAFE_FALLBACK;
  return {
    ok: true,
    source: "last_known_good",
    revision: cached.revision,
    features: cached.features,
    navigation: cached.navigation,
    modules: cached.modules,
  };
}

async function fetchDurableControlPlane(): Promise<DurableSnapshot> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!baseUrl || !anonKey) throw new Error("Public control plane is not configured");

  const url = new URL("/rest/v1/site_settings_control_plane", baseUrl);
  url.searchParams.set("select", "revision,features,navigation,modules");
  url.searchParams.set("singleton", "eq.true");
  url.searchParams.set("limit", "1");
  const response = await fetch(url, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Control plane lookup failed: ${response.status}`);

  const rows = (await response.json()) as Array<{
    revision?: unknown;
    features?: unknown;
    navigation?: unknown;
    modules?: unknown;
  }>;
  const row = rows[0];
  if (!row || typeof row.revision !== "number" || !Number.isSafeInteger(row.revision)) {
    throw new Error("Control plane snapshot is missing");
  }

  const guarded = applyPublicLaunchGuards(
    normalizeSiteNavigation(row.navigation),
    normalizeSiteModules(row.modules),
  );

  return {
    revision: row.revision,
    features: normalizeSiteFeatures(row.features),
    navigation: guarded.navigation,
    modules: guarded.modules,
    fetchedAt: Date.now(),
  };
}

/**
 * One Edge-safe read for all public switches. The database row is a durable,
 * non-secret snapshot. A warm isolate keeps the last successful value without
 * an expiry during an outage; a cold isolate uses the conservative fallback.
 */
export async function fetchSiteControlPlaneEdge(): Promise<SiteControlPlaneEdgeSnapshot> {
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return {
      ok: true,
      source: "fresh",
      revision: cached.revision,
      features: cached.features,
      navigation: cached.navigation,
      modules: cached.modules,
    };
  }
  if (now < retryAfter) return lastKnownGood();
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      cached = await fetchDurableControlPlane();
      retryAfter = 0;
      return {
        ok: true as const,
        source: "fresh" as const,
        revision: cached.revision,
        features: cached.features,
        navigation: cached.navigation,
        modules: cached.modules,
      };
    } catch {
      retryAfter = Date.now() + FAILURE_BACKOFF_MS;
      return lastKnownGood();
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export async function fetchSiteFeaturesEdge(): Promise<SiteFeaturesGlobal> {
  return (await fetchSiteControlPlaneEdge()).features;
}

export async function fetchSiteNavigationEdge(): Promise<SiteNavigationGlobal> {
  return (await fetchSiteControlPlaneEdge()).navigation;
}

export async function fetchSiteModulesEdge(): Promise<SiteModulesGlobal> {
  return (await fetchSiteControlPlaneEdge()).modules;
}
