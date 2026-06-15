import "server-only";

import { getAiraloConfig } from "@/lib/airalo/env";
import { localizeAiraloUrl } from "@/lib/airalo/locale-url";
import { createTravelpayoutsPartnerLink } from "@/lib/travelpayouts/client";
import { getTravelpayoutsConfig, isTravelpayoutsConfigured } from "@/lib/travelpayouts/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { LocaleCode } from "@/types/locale";

/** Airalo program in Travelpayouts (manual link template from docs). */
const AIRALO_PROGRAM_ID = 8310;
const AIRALO_CAMPAIGN_ID = 541;

export function buildManualAiraloAffiliateUrl(airaloUrl: string): string {
  const config = getTravelpayoutsConfig();
  const params = new URLSearchParams({
    marker: String(config.marker),
    trs: String(config.trs),
    p: String(AIRALO_PROGRAM_ID),
    u: airaloUrl,
    campaign_id: String(AIRALO_CAMPAIGN_ID),
  });
  return `https://tp.media/r?${params.toString()}`;
}

export function getAiraloAffiliateHomeUrl(): string | null {
  return getAiraloConfig().affiliateHomeUrl;
}

export async function resolveCountryAffiliateUrl(input: {
  countryId: string;
  countrySlug: string;
  locale?: LocaleCode;
}): Promise<string | undefined> {
  const homeUrl = getAiraloAffiliateHomeUrl();
  if (input.countryId === "global" && homeUrl) {
    return input.locale ? localizeAiraloUrl(homeUrl, input.locale) : homeUrl;
  }

  if (!isTravelpayoutsConfigured()) {
    const landing = buildAiraloCountryLandingUrl(input.countrySlug, input.locale);
    return homeUrl ?? landing;
  }

  try {
    return await createEsimAffiliateRedirectUrl({
      airaloUrl: buildAiraloCountryLandingUrl(input.countrySlug, input.locale),
      offerId: `country-${input.countryId}`,
      countrySlug: input.countrySlug,
    });
  } catch {
    return homeUrl ?? buildAiraloCountryLandingUrl(input.countrySlug, input.locale);
  }
}

export async function createEsimAffiliateRedirectUrl(input: {
  airaloUrl: string;
  offerId: string;
  countrySlug?: string;
}): Promise<string> {
  try {
    const link = await createTravelpayoutsPartnerLink({
      url: input.airaloUrl,
      subId: `esim:${input.countrySlug ?? "global"}:${input.offerId}`,
    });
    return link.partnerUrl?.trim() || link.url;
  } catch {
    return buildManualAiraloAffiliateUrl(input.airaloUrl);
  }
}

export async function logEsimAffiliateClick(input: {
  offerId: string;
  countrySlug?: string;
  partnerUrl: string;
  referer?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("affiliate_link_clicks").insert({
      experience_id: null,
      experience_slug: `esim:${input.countrySlug ?? "global"}:${input.offerId}`,
      partner_url: input.partnerUrl,
      referer: input.referer ?? null,
      user_agent: input.userAgent ?? null,
    });
  } catch {
    /* analytics must not block redirect */
  }
}

export function buildAiraloCountryLandingUrl(countrySlug: string, locale?: LocaleCode): string {
  const slug = countrySlug.trim().replace(/^\/+|\/+$/g, "");
  const url = `https://www.airalo.com/${slug}-esim`;
  return locale ? localizeAiraloUrl(url, locale) : url;
}
