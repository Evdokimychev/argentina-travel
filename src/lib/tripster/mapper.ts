import { slugifyTourTitle } from "@/lib/tour-slug";
import { parseExcursionPayload } from "@/lib/tripster/excursion-payload";
import type {
  TripsterCity,
  TripsterCountry,
  TripsterExperience,
  TripsterPhoto,
} from "@/lib/tripster/types";
import type {
  ExcursionCity,
  ExcursionDetail,
  ExcursionListing,
  ExcursionPhoto,
} from "@/types/excursion";

export function generateExperienceSlug(title: string, tripsterId: number): string {
  const base = slugifyTourTitle(title);
  return `${base}-t${tripsterId}`;
}

export function mapPhotos(photos?: TripsterPhoto[]): ExcursionPhoto[] {
  if (!photos?.length) return [];
  return photos.map((photo) => ({
    thumbnail: photo.thumbnail,
    medium: photo.medium,
    type: photo.type,
  }));
}

export function resolveCoverImage(experience: TripsterExperience): string | undefined {
  const first = experience.photos?.[0];
  return first?.medium || first?.thumbnail || experience.city?.image?.cover;
}

export function resolveCityName(city?: TripsterCity | null): string {
  return city?.name_ru?.trim() || city?.name_en?.trim() || "Аргентина";
}

export function experienceToListingRow(
  experience: TripsterExperience,
  countryId: number,
  city: TripsterCity,
  slug: string,
  partnerUrl: string | null
) {
  const price = experience.price;
  return {
    id: experience.id,
    slug,
    country_id: countryId,
    city_id: city.id,
    title: experience.title?.trim() || `Экскурсия ${experience.id}`,
    tagline: experience.tagline ?? null,
    annotation: experience.annotation ?? null,
    description: experience.description ?? null,
    status: experience.status ?? null,
    experience_type: experience.type ?? null,
    format: experience.format ?? null,
    duration_minutes:
      experience.duration != null ? Math.round(Number(experience.duration) * 60) : null,
    rating: experience.rating ?? null,
    review_count: experience.review_count ?? 0,
    price_value: price?.value ?? null,
    price_currency: price?.currency ?? null,
    price_display: price?.value_string ?? null,
    tripster_url: experience.url?.trim() || `https://experience.tripster.ru/experience/${experience.id}/`,
    partner_url: partnerUrl,
    cover_image: resolveCoverImage(experience) ?? null,
    photos: mapPhotos(experience.photos),
    payload: experience as unknown as Record<string, unknown>,
    synced_at: new Date().toISOString(),
  };
}

export function countryToRow(country: TripsterCountry) {
  return {
    id: country.id,
    slug: country.slug ?? null,
    name_ru: country.name_ru ?? null,
    name_en: country.name_en ?? null,
    currency: country.currency ?? null,
    experience_count: country.experience_count ?? 0,
    payload: country as unknown as Record<string, unknown>,
  };
}

export function cityToRow(city: TripsterCity, countryId: number) {
  return {
    id: city.id,
    country_id: countryId,
    slug: city.slug?.trim() || `city-${city.id}`,
    name_ru: city.name_ru ?? null,
    name_en: city.name_en ?? null,
    experience_count: city.experience_count ?? 0,
    cover_image: city.image?.cover ?? city.image?.thumbnail ?? null,
    payload: city as unknown as Record<string, unknown>,
  };
}

type ExperienceRow = {
  id: number;
  slug: string;
  country_id: number;
  city_id: number;
  title: string;
  tagline?: string | null;
  annotation?: string | null;
  description?: string | null;
  status?: string | null;
  experience_type?: string | null;
  format?: string | null;
  duration_minutes?: number | null;
  rating?: number | null;
  review_count: number;
  price_value?: number | null;
  price_currency?: string | null;
  price_display?: string | null;
  tripster_url?: string;
  partner_url?: string | null;
  cover_image?: string | null;
  photos?: ExcursionPhoto[] | null | unknown;
  payload?: TripsterExperience | unknown;
};

type CityRow = {
  id: number;
  slug: string;
  name_ru: string | null;
  name_en: string | null;
  experience_count: number;
  cover_image: string | null;
};

export function rowToExcursionListing(
  row: ExperienceRow,
  city?: CityRow | null
): ExcursionListing {
  const cityName = city
    ? city.name_ru?.trim() || city.name_en?.trim() || "Аргентина"
    : "Аргентина";

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline ?? undefined,
    cityId: row.city_id,
    citySlug: city?.slug ?? "",
    cityName,
    coverImage: row.cover_image ?? undefined,
    rating: row.rating != null ? Number(row.rating) : undefined,
    reviewCount: row.review_count,
    priceValue: row.price_value != null ? Number(row.price_value) : undefined,
    priceCurrency: row.price_currency ?? undefined,
    priceDisplay: row.price_display ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    format: row.format ?? undefined,
  };
}

export function rowToExcursionDetail(
  row: ExperienceRow,
  city?: CityRow | null
): ExcursionDetail {
  const listing = rowToExcursionListing(row, city);
  const payload = row.payload as TripsterExperience | undefined;
  const photosRaw = row.photos;
  const photos: ExcursionPhoto[] = Array.isArray(photosRaw)
    ? (photosRaw as ExcursionPhoto[])
    : mapPhotos(payload?.photos);

  const parsed = parseExcursionPayload(payload);
  const tags =
    payload?.tags
      ?.filter((tag) => tag.name?.trim())
      .map((tag) => ({
        id: tag.id,
        name: tag.name!.trim(),
        url: tag.url,
      })) ?? [];

  return {
    ...listing,
    annotation: row.annotation ?? undefined,
    description: row.description ?? undefined,
    photos,
    tripsterUrl: row.tripster_url ?? "",
    bookingHref: `/api/affiliate/go/${row.slug}`,
    experienceType: row.experience_type ?? undefined,
    maxPersons: payload?.max_persons ?? undefined,
    childFriendly: payload?.child_friendly ?? undefined,
    instantBooking: payload?.instant_booking ?? undefined,
    isBookable: parsed.isBookable,
    movementType: parsed.movementType,
    visitorsCount: parsed.visitorsCount,
    comfortLevelInfo: parsed.comfortLevelInfo,
    priceIncluded: parsed.priceIncluded,
    priceExcluded: parsed.priceExcluded,
    priceDescription: parsed.priceDescription ?? listing.priceDisplay,
    meetingPoint: parsed.meetingPoint,
    finishPoint: parsed.finishPoint,
    guide: parsed.guide,
    descriptionBlocks: parsed.descriptionBlocks,
    ticketOptions: parsed.ticketOptions,
    tags,
    coverImage: listing.coverImage ?? parsed.coverImage,
  };
}

export function rowToExcursionCity(row: CityRow): ExcursionCity {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name_ru?.trim() || row.name_en?.trim() || row.slug,
    experienceCount: row.experience_count,
    coverImage: row.cover_image ?? undefined,
  };
}

export function buildAffiliateBookingHref(slug: string): string {
  return `/api/affiliate/go/${slug}`;
}
