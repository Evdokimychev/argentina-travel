import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { TourDetail, TourListing } from "@/types";
import {
  formatYouTravelListedPrice,
  normalizeYouTravelPartnerPrice,
  resolveYouTravelListingPriceFromOffers,
  type YouTravelOfferListingRow,
} from "@/lib/youtravel/offers-mapper";
import {
  youtravelTourListingId,
} from "@/lib/youtravel/partner-tour-utils";
import {
  mapYouTravelChildrenSummaryToPolicy,
  resolveYouTravelGallery,
  resolveYouTravelMediaUrl,
  resolveYouTravelMinimumAge,
} from "@/lib/youtravel/partner-tour-content";
import type { YouTravelTour } from "@/lib/youtravel/types";
import type { ActivityType, DurationBucket, GroupSizeBucket, TourDate } from "@/types";
import { resolveArgentinaCity } from "@/lib/argentina-cities";
import { resolvePartnerTourFilterPriceUsd } from "@/lib/partner-tours/filter-price";
import { plainTextFromRichContent } from "@/lib/rich-text";
import { fetchYouTravelPublicPageExtras } from "@/lib/youtravel/public-description";
import { parseYouTravelArrivalDateTime } from "@/lib/youtravel/partner-tour-locations";
import {
  mapYouTravelActivityToDifficultyLevel,
  mapYouTravelComfortToComfortLevel,
  resolveYouTravelActivityLevelFromPayload,
  resolveYouTravelComfortLevelFromPayload,
} from "@/lib/youtravel/partner-levels";
import { resolveYouTravelTourReviews } from "@/lib/youtravel/partner-tour-reviews";
import { syncYouTravelTourReviewCount } from "@/lib/youtravel/review-mapper";
import {
  resolveYouTravelInstantBooking,
  resolveYouTravelTourGuaranteed,
} from "@/lib/youtravel/partner-tour-details";
import { resolveYouTravelGroupSize } from "@/lib/youtravel/partner-tour-group-size";
import { resolveYouTravelThematicTags } from "@/lib/youtravel/partner-tour-tags";

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
  const raw =
    payload?.activityType ??
    payload?.main_type ??
    payload?.type ??
    "";
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
  const durationDays = row.duration_days ?? payload.days?.length ?? payload.durationDays ?? payload.duration ?? 1;
  const durationNights = row.duration_nights ?? Math.max(durationDays - 1, 0);
  const photos = resolveYouTravelGallery(payload, row.photos);
  const image =
    resolveYouTravelMediaUrl(row.cover_image) ??
    photos[0] ??
    "/media/placeholders/tour-card.jpg";
  const destination = row.city?.trim() || row.region?.trim() || row.country?.trim() || "Аргентина";
  const listingId = youtravelTourListingId(row.id);
  const normalizedPrice = normalizeYouTravelPartnerPrice(row.price_value, row.price_currency);
  const priceUsd =
    resolvePartnerTourFilterPriceUsd({
      partnerSource: "youtravel",
      id: listingId,
      priceUsd: 0,
      partnerPriceValue: normalizedPrice.value ?? row.price_value ?? undefined,
      partnerPriceCurrency: normalizedPrice.currency ?? row.price_currency ?? undefined,
    }) ?? 0;
  const priceDisplay =
    row.price_display ??
    formatYouTravelListedPrice(normalizedPrice.value ?? row.price_value, normalizedPrice.currency ?? row.price_currency) ??
    undefined;
  const { min: groupMin, max: groupMax } = resolveYouTravelGroupSize(payload);
  const expert =
    payload.expert ?? payload.expert_data ?? payload.organizer ?? payload.travelExpert ?? null;
  const coordinates = resolveListingCoordinates(payload, destination);
  const parsedRating = Number.parseFloat(String(row.rating ?? payload.rating ?? ""));
  const rating = Number.isFinite(parsedRating) ? parsedRating : 0;
  const parsedReviews = Number.parseInt(String(row.review_count ?? payload.count_reviews ?? 0), 10);
  const comfortLevel = mapYouTravelComfortToComfortLevel(
    resolveYouTravelComfortLevelFromPayload(payload) ?? payload.comfort_data?.level,
  );
  const difficultyLevel = mapYouTravelActivityToDifficultyLevel(
    resolveYouTravelActivityLevelFromPayload(payload) ?? payload.activity_data?.level,
  );
  const minimumAge = resolveYouTravelMinimumAge(payload);
  const childrenAllowed = mapYouTravelChildrenSummaryToPolicy(payload);

  return {
    id: listingId,
    slug: row.slug,
    title: row.title,
    shortDescription:
      plainTextFromRichContent(
        payload.preview_text ||
          payload.previewText ||
          payload.shortDescription ||
          payload.subtitle ||
          payload.annotation,
      ) || row.title,
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
    comfortLevel,
    difficultyLevel,
    language: ["Русский"],
    childrenAllowed,
    minimumAge,
    groupSizeMin: groupMin,
    groupSizeMax: groupMax,
    groupSizeBucket: groupBucket(groupMin, groupMax),
    availableDates: [],
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    rating,
    reviewCount: Number.isFinite(parsedReviews) ? parsedReviews : 0,
    organizer: {
      name: expert?.name ?? expert?.fullName ?? "Тревел-эксперт YouTravel",
      avatar:
        resolveYouTravelMediaUrl(expert?.avatar) ??
        resolveYouTravelMediaUrl(expert?.photo) ??
        "",
      slug: expert?.slug ?? `youtravel-expert-${expert?.id ?? row.id}`,
    },
    organizerOwnerId: expert?.id ? `youtravel-expert-${expert.id}` : undefined,
    badges: [],
    partnerSource: "youtravel",
    partnerPriceDisplay: priceDisplay,
    partnerPriceValue: normalizedPrice.value ?? row.price_value ?? undefined,
    partnerPriceCurrency: normalizedPrice.currency ?? row.price_currency ?? undefined,
    partnerPriceUnit: "per_person",
    partnerInstantBooking: resolveYouTravelInstantBooking(payload),
    partnerTourGuaranteed: resolveYouTravelTourGuaranteed(payload),
    partnerThematicTags: resolveYouTravelThematicTags(payload),
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
    .select("tour_id, start_date, end_date, seats_available, price_value, price_currency, payload")
    .in("tour_id", tourIds)
    .order("start_date", { ascending: true });

  const offersByTour = new Map<number, TourDate[]>();
  const offerPriceRowsByTour = new Map<number, YouTravelOfferListingRow[]>();
  for (const offer of offerRows ?? []) {
    if (!offer.start_date) continue;
    const list = offersByTour.get(offer.tour_id) ?? [];
    list.push({
      start: offer.start_date.slice(0, 10),
      end: (offer.end_date ?? offer.start_date).slice(0, 10),
      spotsLeft: Math.max(offer.seats_available ?? 0, 0),
    });
    offersByTour.set(offer.tour_id, list);

    const priceRows = offerPriceRowsByTour.get(offer.tour_id) ?? [];
    priceRows.push({
      price_value: offer.price_value,
      price_currency: offer.price_currency,
      payload: offer.payload as YouTravelOfferListingRow["payload"],
    });
    offerPriceRowsByTour.set(offer.tour_id, priceRows);
  }

  return data.map((row) => {
    const listing = rowToListing(row as YouTravelTourRow);
    listing.availableDates = offersByTour.get(row.id) ?? [];

    const offerPrices = resolveYouTravelListingPriceFromOffers(
      offerPriceRowsByTour.get(row.id) ?? [],
      {
        priceValue: listing.partnerPriceValue,
        priceCurrency: listing.partnerPriceCurrency,
        priceUsd: listing.priceUsd,
      },
    );

    if (offerPrices.partnerPriceValue != null) {
      listing.partnerPriceValue = offerPrices.partnerPriceValue;
      listing.partnerPriceCurrency = offerPrices.partnerPriceCurrency;
      listing.partnerOriginalPriceValue = offerPrices.partnerOriginalPriceValue;
      listing.partnerPriceDisplay = formatYouTravelListedPrice(
        offerPrices.partnerPriceValue,
        offerPrices.partnerPriceCurrency,
      );
      if (offerPrices.priceUsd != null) {
        listing.priceUsd = offerPrices.priceUsd;
      }
      if (offerPrices.originalPriceUsd != null) {
        listing.originalPriceUsd = offerPrices.originalPriceUsd;
      }
    }

    return listing;
  });
}

async function enrichYouTravelPayload(row: YouTravelTourRow): Promise<YouTravelTour> {
  const payload = (row.payload ?? {}) as YouTravelTour;
  const needsDescription =
    !payload.public_description?.trim() &&
    !payload.public_page_extras?.descriptionHtml?.trim();
  const hasActivityLevel = Boolean(resolveYouTravelActivityLevelFromPayload(payload));
  const hasActivityComment = Boolean(
    payload.public_page_extras?.activityComment?.trim() ||
      payload.public_activity_comment?.trim(),
  );
  const needsActivityExtras = hasActivityLevel && !hasActivityComment;
  const needsComfortExtras =
    Boolean(payload.comfort_data?.level) &&
    !payload.public_page_extras?.comfortDescription?.trim();
  const hasAllocationPhotos = Boolean(
    Array.isArray(payload.photo_allocation) && payload.photo_allocation.length > 0,
  );
  const hasPublicPhotos = Boolean(payload.public_page_extras?.accommodationPhotos?.length);
  const needsAccommodationPhotos =
    Boolean(payload.type_allocation || payload.comfort_data?.level) &&
    !hasAllocationPhotos &&
    !hasPublicPhotos;
  const existingArrival = payload.public_page_extras?.arrivalInfo;
  const startArrivalTime = parseYouTravelArrivalDateTime(existingArrival?.start?.date).timePart;
  const finishArrivalTime = parseYouTravelArrivalDateTime(existingArrival?.finish?.date).timePart;
  const needsArrivalExtras =
    !existingArrival?.start?.date?.trim() ||
    !existingArrival?.finish?.date?.trim() ||
    !startArrivalTime ||
    !finishArrivalTime;

  const needsImportantToKnow = !payload.public_page_extras?.importantToKnowItems?.length;

  if (
    !needsDescription &&
    !needsActivityExtras &&
    !needsComfortExtras &&
    !needsAccommodationPhotos &&
    !needsArrivalExtras &&
    !needsImportantToKnow
  ) {
    return payload;
  }

  const serpLink =
    payload.serp && typeof payload.serp === "object" && "link" in payload.serp
      ? String((payload.serp as { link?: string }).link ?? "")
      : undefined;

  const extras = await fetchYouTravelPublicPageExtras(row.id, serpLink);
  if (!extras) return payload;

  const mergedExtras = {
    ...payload.public_page_extras,
    descriptionHtml:
      payload.public_page_extras?.descriptionHtml?.trim() || extras.descriptionHtml,
    schemaDescription:
      payload.public_page_extras?.schemaDescription?.trim() || extras.schemaDescription,
    activityComment:
      payload.public_page_extras?.activityComment?.trim() ||
      payload.public_activity_comment?.trim() ||
      extras.activityComment,
    activityDescription:
      payload.public_page_extras?.activityDescription?.trim() ||
      payload.public_activity_description?.trim() ||
      extras.activityDescription,
    activityLabel:
      payload.public_page_extras?.activityLabel?.trim() ||
      payload.public_activity_label?.trim() ||
      extras.activityLabel,
    comfortDescription:
      payload.public_page_extras?.comfortDescription?.trim() || extras.comfortDescription,
    accommodationPhotos:
      payload.public_page_extras?.accommodationPhotos?.length
        ? payload.public_page_extras.accommodationPhotos
        : extras.accommodationPhotos,
    arrivalInfo: (() => {
      const local = payload.public_page_extras?.arrivalInfo;
      const remote = extras.arrivalInfo;
      if (!remote) return local;
      if (!local) return remote;
      const localHasTimes =
        Boolean(parseYouTravelArrivalDateTime(local.start?.date).timePart) &&
        Boolean(parseYouTravelArrivalDateTime(local.finish?.date).timePart);
      return localHasTimes ? local : remote;
    })(),
    importantToKnowItems:
      payload.public_page_extras?.importantToKnowItems?.length
        ? payload.public_page_extras.importantToKnowItems
        : extras.importantToKnowItems,
  };

  return {
    ...payload,
    public_description: payload.public_description ?? extras.schemaDescription ?? undefined,
    public_page_extras: mergedExtras,
    public_activity_description:
      payload.public_activity_description ?? mergedExtras.activityDescription ?? undefined,
    public_activity_comment:
      payload.public_activity_comment ?? mergedExtras.activityComment ?? undefined,
    public_activity_label:
      payload.public_activity_label ?? mergedExtras.activityLabel ?? undefined,
  };
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
  const enrichedPayload = await enrichYouTravelPayload(data as YouTravelTourRow);
  const reviews = await resolveYouTravelTourReviews(data.id, enrichedPayload);
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

  const detail = youtravelRowToDetail(
    { ...(data as YouTravelTourRow), payload: enrichedPayload },
    { offers: offerPayloads, reviews },
  );
  return {
    ...detail,
    reviewCount: syncYouTravelTourReviewCount(detail, reviews),
  };
}
