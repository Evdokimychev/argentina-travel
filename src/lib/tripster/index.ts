export {
  fetchAllArgentinaExperiences,
  fetchAllTripsterExperiences,
  fetchArgentinaCities,
  fetchTripsterCities,
  fetchTripsterCountries,
  fetchTripsterExperience,
  fetchTripsterExperienceReviews,
  fetchTripsterExperienceSchedule,
  fetchTripsterExperiences,
  isArgentinaCountry,
  resolveArgentinaCountry,
  TripsterApiError,
  isTripsterConfigured,
} from "@/lib/tripster/client";

export { getTripsterAccessToken, clearTripsterTokenCache } from "@/lib/tripster/auth";
export { getTripsterConfig, getTripsterSyncCountryMatchers, isTripsterConfigured as isTripsterEnvConfigured } from "@/lib/tripster/env";

export type {
  TripsterCity,
  TripsterCountry,
  TripsterExperience,
  TripsterExperienceListParams,
  TripsterPaginated,
  TripsterPrice,
  TripsterReview,
} from "@/lib/tripster/types";

export {
  generateExperienceSlug,
  experienceToListingRow,
  countryToRow,
  cityToRow,
  buildAffiliateBookingHref,
} from "@/lib/tripster/mapper";

export {
  fetchExcursionListings,
  fetchExcursionBySlug,
  fetchExcursionCities,
  fetchExcursionCityBySlug,
  fetchExcursionSlugs,
  fetchExperienceForAffiliate,
  logAffiliateClick,
  updateExperiencePartnerUrl,
} from "@/lib/tripster/repository";

export {
  fetchExcursionsServer,
  fetchExcursionDetailServer,
  fetchExcursionCityServer,
  fetchExcursionSlugsServer,
} from "@/lib/tripster/excursion-server";
