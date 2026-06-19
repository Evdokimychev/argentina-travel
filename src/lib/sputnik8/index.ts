export {
  fetchAllArgentinaProducts,
  fetchArgentinaCities,
  fetchSputnik8Cities,
  fetchSputnik8Countries,
  fetchSputnik8Country,
  fetchSputnik8Product,
  fetchSputnik8ProductReviews,
  fetchSputnik8Products,
  fetchAllSputnik8Products,
  fetchSputnik8Events,
  fetchSputnik8Event,
  fetchSputnik8EventOrderOptions,
  resolveArgentinaCountry,
  Sputnik8ApiError,
  isSputnik8Configured,
} from "@/lib/sputnik8/client";

export {
  getSputnik8Config,
  getSputnik8SyncCountryMatchers,
  isSputnik8Configured as isSputnik8EnvConfigured,
} from "@/lib/sputnik8/env";

export type {
  Sputnik8City,
  Sputnik8Country,
  Sputnik8Product,
  Sputnik8Event,
  Sputnik8Review,
  Sputnik8OrderRequest,
  Sputnik8OrderResponse,
} from "@/lib/sputnik8/types";

export {
  generateProductSlug,
  productToListingRow,
  countryToRow,
  cityToRow,
  buildAffiliateBookingHref,
} from "@/lib/sputnik8/mapper";

export {
  fetchSputnik8ExcursionListings,
  fetchSputnik8ExcursionBySlug,
  fetchSputnik8ExcursionCities,
  fetchSputnik8ExcursionCityBySlug,
  fetchSputnik8ExcursionSlugs,
  fetchSputnik8ProductForAffiliate,
  logSputnik8AffiliateClick,
  updateSputnik8ProductPartnerUrl,
} from "@/lib/sputnik8/repository";

export {
  fetchSputnik8ProductSchedule,
  createSputnik8Order,
  Sputnik8BookingError,
} from "@/lib/sputnik8/booking-api";
