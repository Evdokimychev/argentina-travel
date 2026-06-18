import {
  resolvePartnerTourPriceFields,
  resolvePartnerTourPriceUnit,
  resolvePartnerTourPriceUsd,
} from "@/lib/tripster/partner-tour-price";
import { parseExcursionPayload } from "@/lib/tripster/excursion-payload";
import {
  buildPartnerContent,
  buildPartnerImportantInfo,
  htmlToBulletItems,
  mapPartnerItineraryFromContent,
  mapTripsterPlanToItinerary,
  resolvePartnerGallery,
} from "@/lib/tripster/partner-tour-content";
import type { TripsterTourPlanDay } from "@/lib/tripster/types";
import { mapTripsterReviewRow, type TripsterReviewRow } from "@/lib/tripster/review-mapper";
import type { TripsterExperience } from "@/lib/tripster/types";
import { htmlToPlainText, sanitizeHtml } from "@/lib/rich-text";
import type {
  AccommodationType,
  ActivityType,
  ComfortLevel,
  ChildrenPolicy,
  DifficultyLevel,
  DurationBucket,
  GroupSizeBucket,
  RichTextBlock,
  TourDate,
  TourDescriptionExtra,
  TourDetail,
  TourItineraryDay,
  TourLanguage,
  TourListing,
  TourReview,
  TourBadge,
} from "@/types";
import { partnerTourListingId } from "@/lib/tripster/partner-tour-utils";

type PartnerTourCityRow = {
  id: number;
  slug: string;
  name_ru: string | null;
  name_en: string | null;
  experience_count: number;
  cover_image: string | null;
};

export type PartnerTourExperienceRow = {
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
  photos?: unknown;
  payload?: TripsterExperience | unknown;
};

type TripsterTourProgramDay = {
  day?: number;
  day_number?: number;
  number?: number;
  title?: string;
  name?: string;
  description?: string;
  text?: string;
  content?: string;
  html?: string;
  photos?: unknown;
};

type ReviewRow = TripsterReviewRow;

function resolvePartnerCityName(city?: PartnerTourCityRow | null): string {
  if (!city) return "Аргентина";
  return city.name_ru?.trim() || city.name_en?.trim() || city.slug;
}

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

function childPolicyFromChildFriendly(childFriendly?: boolean): ChildrenPolicy {
  return childFriendly ? "Без ограничений" : "От 12 лет";
}

function resolveDurationDays(experience: TripsterExperience, durationMinutes?: number | null): {
  durationDays: number;
  durationNights: number;
} {
  if (durationMinutes != null && durationMinutes >= 1440) {
    const durationDays = Math.max(1, Math.round(durationMinutes / 1440));
    return { durationDays, durationNights: Math.max(0, durationDays - 1) };
  }

  const hours = experience.duration ?? (durationMinutes != null ? durationMinutes / 60 : 0);
  if (hours > 0) {
    const durationDays =
      hours >= 20 ? Math.max(1, Math.round(hours / 24)) : Math.max(1, Math.ceil(hours / 24));
    return { durationDays, durationNights: Math.max(0, durationDays - 1) };
  }

  return { durationDays: 1, durationNights: 0 };
}

function resolveGuide(experience: TripsterExperience) {
  return parseExcursionPayload(experience).guide;
}

function resolvePriceUsd(row: PartnerTourExperienceRow): {
  priceUsd: number;
  priceOnRequest: boolean;
  priceFromPrefix: boolean;
} {
  return resolvePartnerTourPriceUsd(row);
}

function normalizeReviewDate(value?: string | null): string {
  if (!value?.trim()) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return value.trim();
}

function mapReviews(rows: ReviewRow[]): TourReview[] {
  return rows.map((row) => {
    const mapped = mapTripsterReviewRow(row);
    return {
      id: String(mapped.id),
      author: mapped.authorName ?? "Путешественник",
      avatar: mapped.authorAvatar ?? "",
      rating: mapped.rating ?? 5,
      date: normalizeReviewDate(mapped.createdAt),
      tripDate: normalizeReviewDate(mapped.tripDate),
      text: mapped.text ?? "",
      photos: mapped.photos ?? [],
      verifiedTrip: true,
    };
  });
}

export function mapPartnerTourReviews(rows: ReviewRow[]): TourReview[] {
  return mapReviews(rows);
}

function mapProgramDay(day: TripsterTourProgramDay, index: number): TourItineraryDay {
  const dayNumber = day.day_number ?? day.day ?? index + 1;
  const title = day.title?.trim() || day.name?.trim() || `День ${dayNumber}`;
  const rawDescription = day.description?.trim() || day.text?.trim() || day.content?.trim() || day.html?.trim() || "";
  const descriptionHtml = rawDescription && /<[^>]+>/.test(rawDescription) ? sanitizeHtml(rawDescription) : undefined;
  return {
    id: `tripster-day-${dayNumber}`,
    dayNumber,
    title,
    description: descriptionHtml ? htmlToPlainText(descriptionHtml) : rawDescription,
    descriptionHtml,
    images: [],
    activities: [],
    meals: [],
    accommodation: "",
  };
}

export function mapItineraryFromProgram(
  program: unknown,
  experience: TripsterExperience
): TourItineraryDay[] {
  const planDays = Array.isArray(program) ? (program as TripsterTourProgramDay[]) : [];
  if (planDays.length && typeof planDays[0]?.number === "number") {
    return mapTripsterPlanToItinerary(planDays as TripsterTourPlanDay[]);
  }

  const days: TripsterTourProgramDay[] = Array.isArray(program)
    ? (program as TripsterTourProgramDay[])
    : Array.isArray((program as { days?: unknown })?.days)
      ? ((program as { days: TripsterTourProgramDay[] }).days ?? [])
      : Array.isArray((program as { results?: unknown })?.results)
        ? ((program as { results: TripsterTourProgramDay[] }).results ?? [])
        : [];

  if (days.length) {
    return days.map(mapProgramDay);
  }

  const content = buildPartnerContent(experience);
  return mapPartnerItineraryFromContent(content, experience);
}

export function partnerTourRowToListing(
  row: PartnerTourExperienceRow,
  city?: PartnerTourCityRow | null
): TourListing {
  const payload = row.payload as TripsterExperience | undefined;
  const experience = payload ?? ({} as TripsterExperience);
  const cityName = city ? resolvePartnerCityName(city) : "Аргентина";
  const { durationDays, durationNights } = resolveDurationDays(experience, row.duration_minutes);
  const guide = resolveGuide(experience);
  const groupMax = experience.max_persons ?? 12;
  const groupMin = 1;
  const price = resolvePriceUsd(row);
  const priceFields = resolvePartnerTourPriceFields(row);
  const priceUnit = resolvePartnerTourPriceUnit(experience);
  const originalPerPerson = experience.price?.discount?.original_price;
  const gallery = resolvePartnerGallery(row, experience);
  const cover = gallery[0] ?? "";

  return {
    id: partnerTourListingId(row.id),
    slug: row.slug,
    title: row.title,
    shortDescription:
      row.tagline?.trim() ||
      row.annotation?.trim()?.slice(0, 220) ||
      "Авторский многодневный тур от партнёра Tripster.",
    image: cover,
    gallery: gallery.length ? gallery : cover ? [cover] : [],
    destination: cityName,
    region: cityName,
    activityType: (experience.format?.trim() ||
      row.format?.trim() ||
      "Авторские туры") as ActivityType,
    durationDays,
    durationNights,
    durationBucket: durationBucket(durationDays),
    priceUsd: price.priceUsd,
    priceOnRequest: price.priceOnRequest,
    priceFromPrefix: price.priceFromPrefix,
    bookingMode: "on_request",
    accommodationType: "Отель" as AccommodationType,
    comfortLevel: "Стандарт" as ComfortLevel,
    difficultyLevel: "Умеренная" as DifficultyLevel,
    language: ["Русский"] as TourLanguage[],
    childrenAllowed: childPolicyFromChildFriendly(experience.child_friendly),
    minimumAge: experience.child_friendly ? 0 : 12,
    groupSizeMin: groupMin,
    groupSizeMax: groupMax,
    groupSizeBucket: groupBucket(groupMin, groupMax),
    availableDates: [] as TourDate[],
    latitude: -34.6,
    longitude: -58.4,
    rating: row.rating != null ? Number(row.rating) : 0,
    reviewCount: row.review_count ?? 0,
    organizer: {
      name: guide?.name ?? "Tripster",
      avatar: guide?.avatar ?? "",
      slug: guide?.id ? `tripster-guide-${guide.id}` : undefined,
    },
    badges: experience.is_new ? (["new"] as TourBadge[]) : [],
    featured: false,
    partnerSource: "tripster",
    partnerPriceDisplay: priceFields.display,
    partnerPriceValue: priceFields.value ?? undefined,
    partnerPriceCurrency: priceFields.currency ?? undefined,
    partnerOriginalPriceValue:
      originalPerPerson != null && Number.isFinite(originalPerPerson)
        ? originalPerPerson
        : undefined,
    partnerPriceUnit: priceUnit,
  };
}

export function partnerTourRowToDetail(
  row: PartnerTourExperienceRow,
  city: PartnerTourCityRow | null | undefined,
  options?: {
    program?: unknown;
    reviews?: ReviewRow[];
  }
): TourDetail {
  const listing = partnerTourRowToListing(row, city);
  const payload = row.payload as TripsterExperience | undefined;
  const experience = payload ?? ({} as TripsterExperience);
  const guide = resolveGuide(experience);
  const cityName = city ? resolvePartnerCityName(city) : listing.region;
  const partnerContent = buildPartnerContent(experience);
  const itinerary = mapItineraryFromProgram(options?.program, experience);
  const included = partnerContent.includedHtml ? htmlToBulletItems(partnerContent.includedHtml) : [];
  const excluded = partnerContent.excludedHtml ? htmlToBulletItems(partnerContent.excludedHtml) : [];
  const descriptionBlocks: RichTextBlock[] = partnerContent.summary
    ? [{ type: "paragraph", content: partnerContent.summary }]
    : [];

  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    country: "Аргентина",
    region: cityName,
    durationDays: listing.durationDays,
    durationNights: listing.durationNights,
    priceUsd: listing.priceUsd,
    priceOnRequest: listing.priceOnRequest,
    priceFromPrefix: listing.priceFromPrefix,
    rating: listing.rating,
    reviewCount: listing.reviewCount,
    gallery: listing.gallery,
    image: listing.image,
    shortDescription: listing.shortDescription,
    difficulty: listing.difficultyLevel,
    comfort: listing.comfortLevel,
    groupMin: listing.groupSizeMin,
    groupMax: listing.groupSizeMax,
    minimumAge: listing.minimumAge,
    bookingMode: "on_request",
    startLocation: partnerContent.meetingPoint,
    places: [],
    routePoints: [],
    descriptionBlocks,
    descriptionExtra: {
      difficulty: "",
      seasonality: "",
      packing: [],
      flights: "",
      meals: "",
      comfort: partnerContent.comfortHtml ? htmlToPlainText(partnerContent.comfortHtml) : "",
      transfers: partnerContent.meetingPoint ?? "",
    },
    itinerary,
    organizerComment: {
      greeting: guide
        ? `Тур проводит ${guide.name} — автор на платформе Tripster.`
        : "Тур размещён на платформе Tripster.",
      recommendations: [],
      routeNotes: partnerContent.finishPoint ? `Финиш: ${partnerContent.finishPoint}` : "",
    },
    organizer: {
      id: guide ? String(guide.id) : "tripster",
      name: guide?.name ?? "Tripster",
      role: "Организатор на Tripster",
      avatar: guide?.avatar ?? "",
      shortDescription: "Партнёрский многодневный тур. Бронирование оформляется на Tripster.",
      rating: listing.rating,
      tourCount: 1,
      travelerCount: partnerContent.visitorsCount ?? experience.visitors_count ?? 0,
      languages: ["Русский"],
      experienceYears: 0,
      phone: "",
      email: "",
      slug: guide?.id ? `tripster-guide-${guide.id}` : undefined,
    },
    reviews: mapReviews(options?.reviews ?? []),
    accommodations: [],
    included,
    excluded,
    arrival: {
      airports: [],
      flights: [],
      transfers: [],
      meetingPoint: partnerContent.meetingPoint ?? "",
    },
    importantInfo: buildPartnerImportantInfo(partnerContent),
    faq: [],
    dates: [],
    tags: ["Tripster", "Партнёрский тур"],
    customBookingLink: {
      url: `/api/affiliate/go/${row.slug}`,
      label: "Забронировать на Tripster",
      openInNewTab: true,
      passContext: true,
      hint: "Вы перейдёте на Tripster с выбранной датой заезда и числом туристов. Оплата и подтверждение происходят там.",
    },
    partnerSource: "tripster",
    partnerExperienceId: row.id,
    partnerPriceDisplay: listing.partnerPriceDisplay,
    partnerPriceValue: listing.partnerPriceValue,
    partnerPriceCurrency: listing.partnerPriceCurrency,
    partnerOriginalPriceValue: listing.partnerOriginalPriceValue,
    partnerPriceUnit: listing.partnerPriceUnit,
    partnerContent,
  };
}
