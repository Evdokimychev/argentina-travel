const WHITELABEL_SCRIPT_BASE = "https://tpscr.com/wl_web/main.js";

export const TRAVELPAYOUTS_WHITELABEL_ID =
  process.env.NEXT_PUBLIC_TRAVELPAYOUTS_WL_ID?.trim() || "17940";

export function getTravelpayoutsWhitelabelScriptUrl(): string {
  return `${WHITELABEL_SCRIPT_BASE}?wl_id=${encodeURIComponent(TRAVELPAYOUTS_WHITELABEL_ID)}`;
}

export const TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID = "tpwl-search";
export const TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID = "tpwl-tickets";
