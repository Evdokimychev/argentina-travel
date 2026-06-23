import "server-only";

import { buildFlightsSearchHref } from "@/lib/flights/search-href";
import type { FlightsSearchHrefOptions } from "@/lib/flights/wl-search-params";
import { resolveAviasalesMarket } from "@/lib/travelpayouts/aviasales/market";
import { getTravelpayoutsConfig, isTravelpayoutsConfigured } from "@/lib/travelpayouts/env";
import { getSiteUrl } from "@/lib/site-url";
import type { LocaleCode } from "@/types/locale";

const PRICE_WIDGET_SCRIPT_BASE = "https://tpscr.com/content";

/** Site design tokens — see src/styles/tokens.css */
export const PRICE_WIDGET_THEME = {
  color_button: "#74acdf",
  color_text: "#1a1a2e",
  color_background: "#FFFFFF",
  color_border: "#e5e7eb",
  border_radius: "12",
} as const;

/** Defaults from Travelpayouts price calendar embed (campaign 100 / promo 2811). */
const PRICE_WIDGET_DEFAULTS = {
  trs: 427300,
  shmarker: 434047,
  powered_by: "true",
  with_fallback: "false",
  non_direct_flights: "true",
  min_lines: "5",
  erid: "2VtzqwMLPDT",
  promo_id: "2811",
  campaign_id: "100",
} as const;

export type TravelpayoutsPriceWidgetOptions = {
  origin: string;
  destination: string;
  locale?: LocaleCode;
  searchOptions?: FlightsSearchHrefOptions;
};

function resolveAffiliateIds(): { trs: number; shmarker: number } {
  if (isTravelpayoutsConfigured()) {
    const config = getTravelpayoutsConfig();
    return { trs: config.trs, shmarker: config.marker };
  }
  return { trs: PRICE_WIDGET_DEFAULTS.trs, shmarker: PRICE_WIDGET_DEFAULTS.shmarker };
}

function resolveCampaignParams(): { erid: string; promo_id: string; campaign_id: string } {
  return {
    erid: process.env.TRAVELPAYOUTS_PRICE_WIDGET_ERID?.trim() || PRICE_WIDGET_DEFAULTS.erid,
    promo_id: process.env.TRAVELPAYOUTS_PRICE_WIDGET_PROMO_ID?.trim() || PRICE_WIDGET_DEFAULTS.promo_id,
    campaign_id:
      process.env.TRAVELPAYOUTS_PRICE_WIDGET_CAMPAIGN_ID?.trim() || PRICE_WIDGET_DEFAULTS.campaign_id,
  };
}

/** Host + path for widget CTA — points to our `/flights` search, not Aviasales. */
export function buildPriceWidgetTargetHost(
  origin: string,
  destination: string,
  searchOptions?: FlightsSearchHrefOptions,
): string {
  const searchPath = buildFlightsSearchHref(origin, destination, searchOptions).replace(/^\//, "");
  const siteHost = new URL(getSiteUrl()).host;
  return `${siteHost}/${searchPath}`;
}

export function buildTravelpayoutsPriceWidgetUrl({
  origin,
  destination,
  locale = "ru",
  searchOptions,
}: TravelpayoutsPriceWidgetOptions): string {
  const normalizedOrigin = origin.trim().toUpperCase();
  const normalizedDestination = destination.trim().toUpperCase();
  const market = resolveAviasalesMarket(locale);
  const { trs, shmarker } = resolveAffiliateIds();
  const campaign = resolveCampaignParams();

  const params = new URLSearchParams({
    currency: market.currency,
    trs: String(trs),
    shmarker: String(shmarker),
    color_button: PRICE_WIDGET_THEME.color_button,
    target_host: buildPriceWidgetTargetHost(normalizedOrigin, normalizedDestination, searchOptions),
    locale: market.locale,
    powered_by: PRICE_WIDGET_DEFAULTS.powered_by,
    origin: normalizedOrigin,
    destination: normalizedDestination,
    with_fallback: PRICE_WIDGET_DEFAULTS.with_fallback,
    non_direct_flights: PRICE_WIDGET_DEFAULTS.non_direct_flights,
    min_lines: PRICE_WIDGET_DEFAULTS.min_lines,
    border_radius: PRICE_WIDGET_THEME.border_radius,
    color_background: PRICE_WIDGET_THEME.color_background,
    color_text: PRICE_WIDGET_THEME.color_text,
    color_border: PRICE_WIDGET_THEME.color_border,
    erid: campaign.erid,
    promo_id: campaign.promo_id,
    campaign_id: campaign.campaign_id,
  });

  return `${PRICE_WIDGET_SCRIPT_BASE}?${params.toString()}`;
}
