import { getGtmPublicConfig } from "@/lib/analytics/gtm-config";
import type { SiteSeoGlobal } from "@/types/site-globals";

/** Partner onboarding code for Yandex Distribution (goargentina.ru). */
export const YANDEX_DISTRIBUTION_VERIFY_CODE = "qjx41i40i9avxij2";

export function resolveYandexDistributionVerifyCode(seo?: Pick<SiteSeoGlobal, "yandexSiteVerification">): string {
  const fromSeo = seo?.yandexSiteVerification?.trim();
  if (fromSeo) return fromSeo;

  const fromEnv = getGtmPublicConfig().yandexSiteVerification?.trim();
  if (fromEnv) return fromEnv;

  return YANDEX_DISTRIBUTION_VERIFY_CODE;
}

export const YANDEX_DISTRIBUTION_VERIFY_PATH = "/yandex-verification";
