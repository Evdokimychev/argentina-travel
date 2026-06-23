import { generateSputnik8ExperienceSlug } from "@/lib/excursion-slug";
import { normalizeExcursionCitySlug } from "@/data/excursion-city-links";
import {
  extractPhotosFromProduct,
  mapPhotos,
  mapSputnik8ReviewsList,
  mergeSputnik8ProductSources,
  parseSputnik8Payload,
  resolveCoverImage,
  resolveDurationMinutes,
  resolvePrice,
} from "@/lib/sputnik8/excursion-payload";
import type { Sputnik8City, Sputnik8Country, Sputnik8Product } from "@/lib/sputnik8/types";
import type {
  ExcursionCity,
  ExcursionDetail,
  ExcursionListing,
  ExcursionPhoto,
  ExcursionReview,
  ExcursionTag,
} from "@/types/excursion";

export { resolveCoverImage, resolveDurationMinutes, resolvePrice, mapPhotos, extractPhotosFromProduct, mergeSputnik8ProductSources };

export function generateProductSlug(title: string, productId: number): string {
  return generateSputnik8ExperienceSlug(title, productId);
}

function resolveProductTitle(product: Sputnik8Product): string {
  return product.title?.trim() || product.name?.trim() || `Экскурсия ${product.id}`;
}

function resolveProductTagline(product: Sputnik8Product): string | undefined {
  return (
    product.tagline?.trim() ||
    product.short_info?.trim() ||
    product.short_description?.trim() ||
    product.annotation?.trim() ||
    undefined
  );
}

function resolveCitySlug(city: Sputnik8City): string {
  return normalizeExcursionCitySlug(city.slug, city.name_ru, city.name, city.name_en);
}

function resolveSputnik8Url(product: Sputnik8Product, city?: Sputnik8City | null): string {
  if (product.url?.trim()) return product.url.trim();
  const citySlug = city ? resolveCitySlug(city) : "argentina";
  return `https://www.sputnik8.com/ru/${citySlug}/activities/${product.id}`;
}

export function productToListingRow(
  product: Sputnik8Product,
  countryId: number,
  city: Sputnik8City,
  slug: string,
  partnerUrl: string | null
) {
  const price = resolvePrice(product);
  const sputnik8Url = resolveSputnik8Url(product, city);

  return {
    id: product.id,
    slug,
    country_id: countryId,
    city_id: city.id,
    title: resolveProductTitle(product),
    tagline: resolveProductTagline(product) ?? null,
    annotation: product.annotation ?? product.short_info ?? product.short_description ?? null,
    description: product.description ?? null,
    status: product.status ?? "active",
    experience_type: product.activity_type ?? product.type ?? null,
    format: product.format ?? null,
    duration_minutes: resolveDurationMinutes(product),
    rating: product.rating ?? null,
    review_count: product.reviews_count ?? product.review_count ?? 0,
    price_value: price.value,
    price_currency: price.currency,
    price_display: price.display,
    sputnik8_url: sputnik8Url,
    partner_url: partnerUrl,
    cover_image: resolveCoverImage(product) ?? null,
    photos: extractPhotosFromProduct(product),
    payload: product as unknown as Record<string, unknown>,
    synced_at: new Date().toISOString(),
  };
}

export function countryToRow(country: Sputnik8Country) {
  return {
    id: country.id,
    slug: country.slug ?? null,
    name_ru: country.name_ru ?? country.name ?? null,
    name_en: country.name_en ?? country.name ?? null,
    currency: country.currency ?? null,
    experience_count: country.products_count ?? 0,
    payload: country as unknown as Record<string, unknown>,
  };
}

export function cityToRow(city: Sputnik8City, countryId: number) {
  return {
    id: city.id,
    country_id: countryId,
    slug: resolveCitySlug(city),
    name_ru: city.name_ru ?? city.name ?? null,
    name_en: city.name_en ?? city.name ?? null,
    experience_count: city.products_count ?? 0,
    cover_image: city.cover_image ?? city.image_url ?? city.photo_url ?? null,
    payload: city as unknown as Record<string, unknown>,
  };
}

type ProductRow = {
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
  sputnik8_url?: string;
  partner_url?: string | null;
  cover_image?: string | null;
  photos?: ExcursionPhoto[] | null | unknown;
  payload?: Sputnik8Product | unknown;
};

type CityRow = {
  id: number;
  slug: string;
  name_ru: string | null;
  name_en: string | null;
  experience_count: number;
  cover_image: string | null;
};

function resolveFormatKind(product: Sputnik8Product): "group" | "individual" {
  const format = (product.format ?? "").toLowerCase();
  if (format.includes("индивид") || format.includes("individual") || product.max_persons === 1) {
    return "individual";
  }
  return "group";
}

function resolvePriceUnit(product: Sputnik8Product): "per_person" | "per_excursion" {
  const ticketOptions = parseSputnik8Payload(product).ticketOptions;
  if (ticketOptions.length > 0) return "per_person";

  const price = product.price;
  if (price && typeof price === "object" && Array.isArray(price.per_person) && price.per_person.length > 0) {
    return "per_person";
  }
  return product.max_persons === 1 ? "per_person" : "per_excursion";
}

function resolveTags(payload?: Sputnik8Product): ExcursionTag[] {
  if (!payload) return [];

  const tags =
    payload.tags
      ?.filter((tag) => (tag.name ?? tag.title)?.trim())
      .map((tag) => ({
        id: tag.id,
        name: (tag.name ?? tag.title)!.trim(),
        url: tag.url,
      })) ?? [];

  if (tags.length > 0) return tags;

  return (
    payload.categories
      ?.filter((category) => (category.name ?? category.title)?.trim())
      .map((category) => ({
        id: category.id,
        name: (category.name ?? category.title)!.trim(),
      })) ?? []
  );
}

function preferNumber(rowValue: number | null | undefined, parsedValue: number | null | undefined) {
  return rowValue != null ? rowValue : parsedValue ?? undefined;
}

function preferString(rowValue: string | null | undefined, parsedValue: string | undefined) {
  return rowValue?.trim() || parsedValue || undefined;
}

export function rowToExcursionListing(row: ProductRow, city?: CityRow | null): ExcursionListing {
  const cityName = city
    ? city.name_ru?.trim() || city.name_en?.trim() || "Аргентина"
    : "Аргентина";
  const payload = row.payload as Sputnik8Product | undefined;
  const parsed = parseSputnik8Payload(payload);
  const resolvedPrice = payload ? resolvePrice(payload) : null;

  const priceValue = preferNumber(
    row.price_value != null ? Number(row.price_value) : null,
    resolvedPrice?.value ?? null
  );
  const priceCurrency = preferString(row.price_currency, resolvedPrice?.currency ?? undefined);
  const priceDisplay = preferString(row.price_display, resolvedPrice?.display ?? undefined);
  const durationMinutes = preferNumber(row.duration_minutes, payload ? resolveDurationMinutes(payload) : null);
  const coverImage = preferString(row.cover_image, parsed.coverImage);

  const priceFrom =
    payload && typeof payload.price === "object"
      ? payload.price.price_from !== false
      : resolvedPrice?.from !== false;

  return {
    partner: "sputnik8",
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline ?? undefined,
    cityId: row.city_id,
    citySlug: city?.slug ?? "",
    cityName,
    coverImage,
    rating: row.rating != null ? Number(row.rating) : undefined,
    reviewCount: row.review_count,
    priceValue,
    priceCurrency,
    priceDisplay,
    priceFrom,
    priceUnit: payload ? resolvePriceUnit(payload) : "per_person",
    durationMinutes,
    format: row.format ?? undefined,
    formatKind: payload ? resolveFormatKind(payload) : "group",
    guide: parsed.guide,
  };
}

export function rowToExcursionDetail(row: ProductRow, city?: CityRow | null): ExcursionDetail {
  const listing = rowToExcursionListing(row, city);
  const payload = row.payload as Sputnik8Product | undefined;
  const parsed = parseSputnik8Payload(payload);

  const rowPhotos: ExcursionPhoto[] = Array.isArray(row.photos) ? (row.photos as ExcursionPhoto[]) : [];
  const payloadPhotos = parsed.photos;
  const photos =
    payloadPhotos.length >= rowPhotos.length && payloadPhotos.length > 0
      ? payloadPhotos
      : rowPhotos.length > 0
        ? rowPhotos
        : payloadPhotos;

  const tags = resolveTags(payload);
  const partnerUrl = (row.partner_url?.trim() || row.sputnik8_url) ?? "";
  const maxPersons = payload?.group_size_max ?? payload?.max_persons ?? undefined;

  return {
    ...listing,
    annotation: row.annotation ?? undefined,
    description: row.description ?? undefined,
    photos,
    tripsterUrl: "",
    partnerUrl,
    bookingHref: `/api/affiliate/go/${row.slug}`,
    experienceType: row.experience_type ?? payload?.type ?? payload?.activity_type ?? undefined,
    maxPersons,
    childFriendly: payload?.child_friendly ?? undefined,
    instantBooking: payload?.instant_booking ?? undefined,
    isBookable: parsed.isBookable,
    movementType: parsed.movementType,
    comfortLevelInfo: undefined,
    priceIncluded: parsed.priceIncluded,
    priceExcluded: parsed.priceExcluded,
    priceDescription: parsed.priceDescription,
    meetingPoint: parsed.meetingPoint,
    finishPoint: parsed.finishPoint,
    guide: parsed.guide
      ? {
          ...parsed.guide,
          rating:
            payload?.guide?.rating ??
            payload?.guide?.review_rating ??
            payload?.host?.rating ??
            payload?.host?.review_rating,
          reviewCount: payload?.guide?.review_count ?? payload?.host?.review_count,
        }
      : undefined,
    descriptionBlocks: parsed.descriptionBlocks,
    ticketOptions: parsed.ticketOptions,
    tags,
    placesToSee: parsed.placesToSee,
    languages: parsed.languages,
    payTypeInText: parsed.payTypeInText,
    minimumBookPeriod: parsed.minimumBookPeriod,
    refundPolicy: parsed.refundPolicy,
    coverImage: listing.coverImage ?? parsed.coverImage ?? photos[0]?.medium,
    reviews: mapSputnik8ReviewsList(payload?.reviews_list),
  };
}

export function rowToExcursionCity(row: CityRow): ExcursionCity {
  const name = row.name_ru?.trim() || row.name_en?.trim() || row.slug;
  return {
    id: row.id,
    slug: normalizeExcursionCitySlug(row.slug, row.name_ru, row.name_en),
    name,
    experienceCount: row.experience_count,
    coverImage: row.cover_image ?? undefined,
  };
}

export function mapSputnik8ReviewRow(row: {
  id: number;
  rating?: number | null;
  author_name?: string | null;
  review_text?: string | null;
  created_at?: string | null;
  payload?: unknown;
}): ExcursionReview {
  const payload = row.payload as Sputnik8Product | { text?: string; content?: string; name?: string } | null;
  return {
    id: row.id,
    rating: row.rating != null ? Number(row.rating) : undefined,
    authorName: row.author_name ?? (payload as { name?: string })?.name ?? undefined,
    text: row.review_text ?? (payload as { text?: string; content?: string })?.text ?? (payload as { content?: string })?.content,
    createdAt: row.created_at ?? undefined,
  };
}

export function buildAffiliateBookingHref(slug: string): string {
  return `/api/affiliate/go/${slug}`;
}
