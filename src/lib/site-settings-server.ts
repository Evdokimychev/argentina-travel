import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type SiteFeatures = {
  maintenanceMode: boolean;
  allowOrganizerSignup: boolean;
};

export type SiteLegal = {
  companyName?: string;
  inn?: string;
  ogrn?: string;
  address?: string;
  supportEmail?: string;
};

const DEFAULT_FEATURES: SiteFeatures = {
  maintenanceMode: false,
  allowOrganizerSignup: true,
};

const CACHE_TTL_MS = 60_000;

let featuresCache: { value: SiteFeatures; at: number } | null = null;

function parseFeatures(value: Json | undefined): SiteFeatures {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_FEATURES;
  }
  const record = value as Record<string, unknown>;
  return {
    maintenanceMode: record.maintenanceMode === true,
    allowOrganizerSignup: record.allowOrganizerSignup !== false,
  };
}

async function loadSettingsKey(key: string): Promise<Json | undefined> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
    return data?.value;
  } catch {
    return undefined;
  }
}

/** Cached read of site feature flags (maintenance, organizer signup). */
export async function fetchSiteFeatures(): Promise<SiteFeatures> {
  const now = Date.now();
  if (featuresCache && now - featuresCache.at < CACHE_TTL_MS) {
    return featuresCache.value;
  }

  const value = await loadSettingsKey("site.features");
  const parsed = parseFeatures(value);
  featuresCache = { value: parsed, at: now };
  return parsed;
}

export function invalidateSiteFeaturesCache(): void {
  featuresCache = null;
}

export async function fetchSiteLegal(): Promise<SiteLegal> {
  const value = await loadSettingsKey("site.legal");
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as SiteLegal;
}
