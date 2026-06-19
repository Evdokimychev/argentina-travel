export const WEGOTTRIP_API_BASE = "https://app.wegotrip.com/api/v2";

/** Argentina in WeGoTrip API. */
export const WEGOTTRIP_ARGENTINA_COUNTRY_ID = 3865483;

export const WEGOTTRIP_FEATURED_CITIES = [
  {
    id: "buenos-aires",
    wegoCityId: 3435910,
    nameKey: "audioGuides.cities.buenosAires",
    countryId: WEGOTTRIP_ARGENTINA_COUNTRY_ID,
  },
] as const;

export const DEFAULT_WEGOTTRIP_CITY_ID = WEGOTTRIP_FEATURED_CITIES[0].wegoCityId;

export function getWeGoTripCityById(cityKey: string) {
  return WEGOTTRIP_FEATURED_CITIES.find((city) => city.id === cityKey);
}

export function resolveWeGoTripApiLang(locale: string): string {
  if (locale === "ru" || locale === "es" || locale === "pt") return locale;
  return "en";
}

export function resolveWeGoTripShopHost(locale: string): "wegotrip.ru" | "wegotrip.com" {
  return locale === "ru" ? "wegotrip.ru" : "wegotrip.com";
}
