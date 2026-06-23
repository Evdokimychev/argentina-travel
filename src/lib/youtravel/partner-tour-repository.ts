import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { TourDetail, TourListing } from "@/types";
import { formatYouTravelListedPrice } from "@/lib/youtravel/offers-mapper";
import {
  youtravelTourListingId,
} from "@/lib/youtravel/partner-tour-utils";
import { resolveYouTravelGallery } from "@/lib/youtravel/partner-tour-content";
import type { YouTravelTour } from "@/lib/youtravel/types";
import type { ActivityType, DurationBucket, GroupSizeBucket, TourDate } from "@/types";
import { resolveArgentinaCity } from "@/lib/argentina-cities";

type DbClient = SupabaseClient<Database>;

export type YouTravelTourRow = {
  id: number;
  slug: string;
  title: string;
  country: string | null;
  region: string | null;
  city: string | null;
  status: string | null;
  duration_days: number | null;
  duration_nights: number | null;
  rating: number | null;
  review_count: number;
  price_value: number | null;
  price_currency: string | null;
  price_display: string | null;
  youtravel_url: string;
  partner_url: string | null;
  cover_image: string | null;
  photos: unknown;
  payload: YouTravelTour | unknown;
};

const LISTING_COLUMNS =
  "id, slug, title, country, region, city, status, duration_days, duration_nights, rating, review_count, price_value, price_currency, price_display, youtravel_url, partner_url, cover_image, photos, payload";

function durationBucket(days: number): DurationBucket {
  if (days <= 2) return "1–2 дня";
  if (days <= 3) return "2–3 дня";
  if (days <= 7) return "4–7 дней";
  if (days <= 14) return "8–14 дней";
  return "15+ дней";
}

function groupBucket(min: number, max: number): GroupSizeBucket {
  if (max <= 1) return "Индивидуально";
  if (max <= 4) return "До 4 человек";
  if (max <= 8) return "До 8 человек";
  if (max <= 12) return "До 12 человек";
  if (max <= 20) return "До 20 человек";
  return "Более 20 человек";
}

function resolveActivityType(tour: YouTravelTourRow): ActivityType {
  const payload = tour.payload as YouTravelTour | undefined;
  const raw = payload?.activityType ?? payload?.type ?? "";
  const normalized = raw.toLowerCase();
  if (normalized.includes("trek") || normalized.includes("поход")) return "Походы";
  if (normalized.includes("photo") || normalized.includes("фото")) return "Фототуры";
  if (normalized.includes("gastro") || normalized.includes("гастро")) return "Гастрономические туры";
  if (normalized.includes("family") || normalized.includes("семей")) return "Семейные путешествия";
  return "Авторские туры";
}

function resolveListingCoordinates(
  payload: YouTravelTour,
  destination: string
): { latitude: number; longitude: number } {
  const lat = payload.latitude;
  const lng = payload.longitude;
  if (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  ) {
    return { latitude: lat, longitude: lng };
  }

  const city = resolveArgentinaCity(destination);
  if (city?.lat != null && city?.lng != null) {
    return { latitude: city.lat, longitude: city.lng };
  }

  return { latitude: 0, longitude: 0 };
}

export function rowToListing(row: YouTravelTourRow): TourListing {
  const payload = (row.payload ?? {}) as YouTravelTour;
  const durationDays = row.duration_days ?? payload.durationDays ?? payload.duration ?? 1;
  const durationNights = row.duration_nights ?? Math.max(durationDays - 1, 0);
  const photos = resolveYouTravelGallery(payload, row.photos);
  const image = row.cover_image ?? photos[0] ?? "/media/placeholders/tour-card.jpg";
  const destination = row.city?.trim() || row.region?.trim() || row.country?.trim() || "Аргентина";
  const priceUsd = row.price_value ?? 0;
  const priceDisplay =
    row.price_display ??
    formatYouTravelListedPrice(row.price_value, row.price_currency) ??
    undefined;
  const groupMin = payload.groupSizeMin ?? 1;
  const groupMax = payload.groupSizeMax ?? 16;
  const expert =
    payload.expert ?? payload.organizer ?? payload.travelExpert ?? null;
  const coordinates = resolveListingCoordinates(payload, destination);

  return {
    id: youtravelTourListingId(row.id),
    slug: row.slug,
    title: row.title,
    shortDescription:
      payload.shortDescription?.trim() ||
      payload.subtitle?.trim() ||
      payload.annotation?.trim() ||
      row.title,
    image,
    gallery: photos.length ? photos : [image],
    destination,
    region: row.region?.trim() || row.country?.trim() || "Аргентина",
    country: row.country?.trim() || undefined,
    activityType: resolveActivityType(row),
    durationDays,
    durationNights,
    durationBucket: durationBucket(durationDays),
    priceUsd,
    priceFromPrefix: true,
    accommodationType: "Отель",
    comfortLevel: "Стандарт",
    difficultyLevel: "Умеренная",
    language: ["Русский"],
    childrenAllowed: "Без ограничений",
    minimumAge: 0,
    groupSizeMin: groupMin,
    groupSizeMax: groupMax,
    groupSizeBucket: groupBucket(groupMin, groupMax),
    availableDates: [],
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    organizer: {
      name: expert?.name ?? expert?.fullName ?? "Тревел-эксперт YouTravel",
      avatar: expert?.avatar ?? expert?.photo ?? "",
      slug: expert?.slug ?? `youtravel-expert-${expert?.id ?? row.id}`,
    },
    organizerOwnerId: expert?.id ? `youtravel-expert-${expert.id}` : undefined,
    badges: [],
    partnerSource: "youtravel",
    partnerPriceDisplay: priceDisplay,
    partnerPriceValue: row.price_value ?? undefined,
    partnerPriceCurrency: row.price_currency ?? undefined,
    partnerPriceUnit: "per_person",
  };
}

export async function fetchYouTravelTourListings(supabase: DbClient): Promise<TourListing[]> {
  const { data, error } = await supabase
    .from("youtravel_tours")
    .select(LISTING_COLUMNS)
    .neq("status", "draft")
    .order("review_count", { ascending: false });

  if (error || !data?.length) return [];

  const tourIds = data.map((row) => row.id);
  const { data: offerRows } = await supabase
    .from("youtravel_offers")
    .select("tour_id, start_date, end_date, seats_available")
    .in("tour_id", tourIds)
    .order("start_date", { ascending: true });

  const offersByTour = new Map<number, TourDate[]>();
  for (const offer of offerRows ?? []) {
    if (!offer.start_date) continue;
    const list = offersByTour.get(offer.tour_id) ?? [];
    list.push({
      start: offer.start_date.slice(0, 10),
      end: (offer.end_date ?? offer.start_date).slice(0, 10),
      spotsLeft: Math.max(offer.seats_available ?? 0, 0),
    });
    offersByTour.set(offer.tour_id, list);
  }

  return data.map((row) => {
    const listing = rowToListing(row as YouTravelTourRow);
    listing.availableDates = offersByTour.get(row.id) ?? [];
    return listing;
  });
}

export async function fetchYouTravelTourSlugs(supabase: DbClient): Promise<string[]> {
  const { data, error } = await supabase
    .from("youtravel_tours")
    .select("slug, status")
    .neq("status", "draft");

  if (error || !data) return [];
  return data.map((row: { slug: string }) => row.slug);
}

export async function fetchYouTravelTourDetail(
  supabase: DbClient,
  slug: string
): Promise<TourDetail | null> {
  const { data, error } = await supabase
    .from("youtravel_tours")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  if (data.status === "draft") return null;

  const { data: offers } = await supabase
    .from("youtravel_offers")
    .select("id, tour_id, start_date, end_date, price_value, price_currency, seats_available, payload")
    .eq("tour_id", data.id)
    .order("start_date", { ascending: true });

  const { youtravelRowToDetail } = await import("@/lib/youtravel/partner-tour-mapper");
  const offerPayloads = (offers ?? []).map((offer) => ({
    id: offer.id,
    tourId: offer.tour_id,
    startDate: offer.start_date ?? undefined,
    endDate: offer.end_date ?? undefined,
    price: offer.price_value ?? undefined,
    currency: offer.price_currency ?? undefined,
    seatsAvailable: offer.seats_available ?? undefined,
    ...(typeof offer.payload === "object" && offer.payload ? offer.payload : {}),
  }));

  const detail = youtravelRowToDetail(data as YouTravelTourRow, { offers: offerPayloads });
  return detail;
}
