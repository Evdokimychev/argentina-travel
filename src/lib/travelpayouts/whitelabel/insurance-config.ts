import "server-only";

import { getTravelpayoutsConfig, isTravelpayoutsConfigured } from "@/lib/travelpayouts/env";

const INSURANCE_SCRIPT_BASE = "https://tpscr.com/content";

/** Defaults from Travelpayouts insurance WL embed (Cherehapa / campaign 24). */
const INSURANCE_WL_DEFAULTS = {
  trs: 427300,
  shmarker: 434047,
  country: "Argentina",
  medicine: "30000",
  powered_by: "true",
  primary: "#74ACDF",
  light: "#F4F8FC",
  background: "#FFFFFF",
  success: "#41CC78",
  warning: "#E8873A",
  error: "#FF6666",
  search: "#E8873A",
  deletion: "#FFECEC",
  erid: "2Vtzque6YTB",
  campaign_id: "24",
  promo_id: "1498",
} as const;

function resolveAffiliateIds(): { trs: number; shmarker: number } {
  if (isTravelpayoutsConfigured()) {
    const config = getTravelpayoutsConfig();
    return { trs: config.trs, shmarker: config.marker };
  }
  return { trs: INSURANCE_WL_DEFAULTS.trs, shmarker: INSURANCE_WL_DEFAULTS.shmarker };
}

export function getInsuranceWhitelabelScriptUrl(): string {
  const { trs, shmarker } = resolveAffiliateIds();

  const params = new URLSearchParams({
    trs: String(trs),
    shmarker: String(shmarker),
    country: INSURANCE_WL_DEFAULTS.country,
    medicine: INSURANCE_WL_DEFAULTS.medicine,
    powered_by: INSURANCE_WL_DEFAULTS.powered_by,
    frame: "false",
    primary: INSURANCE_WL_DEFAULTS.primary,
    light: INSURANCE_WL_DEFAULTS.light,
    background: INSURANCE_WL_DEFAULTS.background,
    success: INSURANCE_WL_DEFAULTS.success,
    warning: INSURANCE_WL_DEFAULTS.warning,
    error: INSURANCE_WL_DEFAULTS.error,
    search: INSURANCE_WL_DEFAULTS.search,
    deletion: INSURANCE_WL_DEFAULTS.deletion,
    erid: INSURANCE_WL_DEFAULTS.erid,
    campaign_id: INSURANCE_WL_DEFAULTS.campaign_id,
    promo_id: INSURANCE_WL_DEFAULTS.promo_id,
  });

  return `${INSURANCE_SCRIPT_BASE}?${params.toString()}`;
}
