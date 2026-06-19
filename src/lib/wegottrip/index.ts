export { buildAudioGuideDetailPath } from "@/lib/wegottrip/paths";
export {
  buildWeGoTripCheckoutUrl,
  buildWeGoTripProductPageUrl,
  getWeGoTripPopularProducts,
  getWeGoTripProductById,
  mapWeGoTripProduct,
  mapWeGoTripProductDetail,
  searchWeGoTrip,
} from "@/lib/wegottrip/client";
export {
  DEFAULT_WEGOTTRIP_CITY_ID,
  getWeGoTripCityById,
  WEGOTTRIP_ARGENTINA_COUNTRY_ID,
  WEGOTTRIP_FEATURED_CITIES,
} from "@/lib/wegottrip/constants";
export type {
  WeGoTripProductDetail,
  WeGoTripProductSummary,
  WeGoTripSearchResult,
} from "@/lib/wegottrip/types";
