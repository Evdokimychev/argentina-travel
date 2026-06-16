const LOCALRENT_SCRIPT_URL = "https://static.localrent.com/booking/v2/wl/app.js";

export const LOCALRENT_AFFILIATE_ID =
  process.env.NEXT_PUBLIC_LOCALRENT_AFFILIATE_ID?.trim() || "16309";

export const LOCALRENT_COUNTRY_ID =
  process.env.NEXT_PUBLIC_LOCALRENT_COUNTRY_ID?.trim() || "40";

export const LOCALRENT_CITY_ID =
  process.env.NEXT_PUBLIC_LOCALRENT_CITY_ID?.trim() || "58911";

export const LOCALRENT_WIDGET_Z_INDEX =
  process.env.NEXT_PUBLIC_LOCALRENT_Z_INDEX?.trim() || "100";

/** "off" keeps widget embedded; "on" hijacks URL routing and breaks Next.js layout. */
export const LOCALRENT_WIDGET_ROUTING =
  process.env.NEXT_PUBLIC_LOCALRENT_ROUTING?.trim() || "off";

export function getLocalRentScriptUrl(): string {
  return LOCALRENT_SCRIPT_URL;
}
