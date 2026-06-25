/** Public analytics IDs — tags are fired from GTM, IDs here are for env/docs only. */

export type GtmPublicConfig = {
  gtmId: string | null;
  ga4MeasurementId: string | null;
  ymCounterId: string | null;
  clarityProjectId: string | null;
  googleSiteVerification: string | null;
  bingSiteVerification: string | null;
  ahrefsSiteVerification: string | null;
  yandexSiteVerification: string | null;
};

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

export function getGtmPublicConfig(): GtmPublicConfig {
  return {
    gtmId: readEnv("NEXT_PUBLIC_GTM_ID"),
    ga4MeasurementId: readEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID"),
    ymCounterId: readEnv("NEXT_PUBLIC_YM_COUNTER_ID"),
    clarityProjectId: readEnv("NEXT_PUBLIC_CLARITY_PROJECT_ID"),
    googleSiteVerification: readEnv("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"),
    bingSiteVerification: readEnv("NEXT_PUBLIC_BING_SITE_VERIFICATION"),
    ahrefsSiteVerification: readEnv("NEXT_PUBLIC_AHREFS_SITE_VERIFICATION"),
    yandexSiteVerification: readEnv("NEXT_PUBLIC_YANDEX_SITE_VERIFICATION"),
  };
}

export function isGtmEnabled(): boolean {
  return Boolean(getGtmPublicConfig().gtmId);
}
