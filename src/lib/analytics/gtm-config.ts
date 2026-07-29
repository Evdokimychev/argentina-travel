/** Public analytics IDs — tags are fired from GTM, IDs here are for env/docs only. */

export type GtmPublicConfig = {
  gtmId: string | null;
  ga4MeasurementId: string | null;
  clarityProjectId: string | null;
  googleSiteVerification: string | null;
  bingSiteVerification: string | null;
  ahrefsSiteVerification: string | null;
  yandexSiteVerification: string | null;
};

function readEnv(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}

export function getGtmPublicConfig(): GtmPublicConfig {
  return {
    gtmId: readEnv(process.env.NEXT_PUBLIC_GTM_ID),
    ga4MeasurementId: readEnv(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID),
    clarityProjectId: readEnv(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID),
    googleSiteVerification: readEnv(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION),
    bingSiteVerification: readEnv(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION),
    ahrefsSiteVerification: readEnv(process.env.NEXT_PUBLIC_AHREFS_SITE_VERIFICATION),
    yandexSiteVerification: readEnv(process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION),
  };
}

export function isGtmEnabled(): boolean {
  return Boolean(getGtmPublicConfig().gtmId);
}
