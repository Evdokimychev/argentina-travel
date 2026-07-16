import type { RichTextBlock, TourDetail, TourListing } from "@/types";
import type { Tour } from "@/types/tour";
import type {
  ExcursionCity,
  ExcursionDescriptionBlock,
  ExcursionDetail,
  ExcursionListing,
} from "@/types/excursion";
import { slugifyTourTitle } from "@/lib/tour-slug";

function stablePositiveId(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return 1_000_000_000 + (hash >>> 0) % 1_000_000_000;
}

function cityNameForListing(listing: TourListing): string {
  return listing.destination?.trim() || listing.region?.trim() || "Аргентина";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function richTextBlockToHtml(block: RichTextBlock): string {
  const content = escapeHtml(block.content.trim());
  if (block.type === "heading") return content ? `<h3>${content}</h3>` : "";
  if (block.type === "quote") return content ? `<blockquote>${content}</blockquote>` : "";
  if (block.type === "list") {
    const items = (block.items ?? [])
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
    return items ? `<ul>${items}</ul>` : "";
  }
  if (block.type === "paragraph") return content ? `<p>${content}</p>` : "";
  return "";
}

function nativeDescriptionBlocks(detail: TourDetail): ExcursionDescriptionBlock[] {
  const blocks: ExcursionDescriptionBlock[] = [];
  const aboutHtml = detail.descriptionBlocks.map(richTextBlockToHtml).filter(Boolean).join("");
  if (aboutHtml) blocks.push({ title: "Об экскурсии", html: aboutHtml });

  const programHtml = detail.itinerary
    .map((day) => {
      const title = escapeHtml(day.title.trim() || `Программа ${day.dayNumber}`);
      const description = escapeHtml(day.description.trim());
      return `<h3>${title}</h3>${description ? `<p>${description}</p>` : ""}`;
    })
    .join("");
  if (programHtml) blocks.push({ title: "Программа", html: programHtml });
  return blocks;
}

export function nativeTourListingToExcursion(listing: TourListing): ExcursionListing {
  const cityName = cityNameForListing(listing);
  return {
    partner: "platform",
    id: stablePositiveId(`native-excursion:${listing.id}`),
    slug: listing.slug,
    title: listing.title,
    tagline: listing.shortDescription,
    cityId: stablePositiveId(`native-city:${cityName.toLowerCase()}`),
    citySlug: slugifyTourTitle(cityName),
    cityName,
    coverImage: listing.image,
    rating: listing.reviewCount > 0 ? listing.rating : undefined,
    reviewCount: listing.reviewCount,
    priceValue: listing.priceOnRequest ? undefined : listing.priceUsd,
    priceCurrency: "USD",
    priceDisplay: listing.priceOnRequest ? "Цена по запросу" : undefined,
    priceFrom: listing.priceFromPrefix,
    priceUnit: "per_person",
    durationMinutes: Math.max(60, listing.durationDays * 8 * 60),
    formatKind: listing.bookingMode === "on_request" ? "individual" : "group",
  };
}

export function nativeTourDetailToExcursion(
  canonical: Tour,
  detail: TourDetail
): ExcursionDetail {
  const listing = nativeTourListingToExcursion({
    id: detail.id,
    slug: detail.slug,
    title: detail.title,
    productType: "excursion",
    shortDescription: detail.shortDescription,
    image: detail.image,
    gallery: detail.gallery,
    destination: canonical.geography.destination,
    region: detail.region,
    activityType: canonical.classification.primaryActivity,
    durationDays: detail.durationDays,
    durationNights: detail.durationNights,
    durationBucket: "1–2 дня",
    priceUsd: detail.priceUsd,
    originalPriceUsd: detail.originalPriceUsd,
    priceOnRequest: detail.priceOnRequest,
    priceFromPrefix: detail.priceFromPrefix,
    bookingMode: detail.bookingMode,
    requestDateFrom: detail.requestDateFrom,
    requestDateTo: detail.requestDateTo,
    accommodationType: detail.accommodationType ?? "Без проживания",
    comfortLevel: detail.comfort,
    difficultyLevel: detail.difficulty,
    language: canonical.participants.languages,
    childrenAllowed: detail.minimumAge ? `От ${detail.minimumAge} лет` : "Без ограничений",
    minimumAge: detail.minimumAge ?? 0,
    groupSizeMin: detail.groupMin,
    groupSizeMax: detail.groupMax,
    groupSizeBucket: "До 8 человек",
    availableDates: detail.dates.map((date) => ({
      start: date.startDate,
      end: date.endDate,
      spotsLeft: date.spotsLeft,
    })),
    latitude: canonical.geography.coordinates?.lat ?? -34.6,
    longitude: canonical.geography.coordinates?.lng ?? -58.4,
    rating: detail.rating,
    reviewCount: detail.reviewCount,
    organizer: {
      name: detail.organizer.name,
      avatar: detail.organizer.avatar,
      slug: detail.organizer.slug,
    },
    badges: [],
  } as unknown as TourListing);

  const gallery = [...new Set([detail.image, ...detail.gallery].filter(Boolean))];
  const organizerId = stablePositiveId(`native-organizer:${detail.organizer.id}`);

  return {
    ...listing,
    annotation: detail.shortDescription,
    description: detail.descriptionBlocks
      .filter((block) => block.type === "paragraph")
      .map((block) => block.content)
      .join("\n"),
    photos: gallery.map((image) => ({ thumbnail: image, medium: image, type: "image" })),
    tripsterUrl: "",
    partnerUrl: "",
    bookingHref: `/excursions/${detail.slug}#booking`,
    experienceType: "Экскурсия",
    maxPersons: detail.groupMax,
    childFriendly: (detail.minimumAge ?? 0) <= 12,
    instantBooking: false,
    isBookable: true,
    movementType: canonical.classification.primaryActivity,
    comfortLevelInfo: canonical.levels.difficultyDescription,
    priceIncluded: detail.included.join("\n"),
    priceExcluded: detail.excluded.join("\n"),
    priceDescription: detail.priceOnRequest ? "Стоимость уточняется у организатора" : undefined,
    meetingPoint: detail.arrival.meetingPoint
      ? { text: detail.arrival.meetingPoint }
      : undefined,
    finishPoint: detail.arrival.finishPoint ? { text: detail.arrival.finishPoint } : undefined,
    guide: {
      id: organizerId,
      name: detail.organizer.name,
      avatar: detail.organizer.avatar,
      rating: detail.organizer.rating,
      reviewCount: detail.organizer.reviewCount,
      cityName: listing.cityName,
      roleLabel: detail.organizer.role,
      description: detail.organizer.extendedDescription ?? detail.organizer.shortDescription,
    },
    descriptionBlocks: nativeDescriptionBlocks(detail),
    ticketOptions: [],
    tags: detail.tags.map((name) => ({ id: stablePositiveId(`native-tag:${name}`), name })),
    placesToSee: detail.places.map((place) => place.title).filter(Boolean).join("\n"),
    languages: canonical.participants.languages,
    reviews: detail.reviews.map((review) => ({
      id: stablePositiveId(`native-review:${review.id}`),
      rating: review.rating,
      authorName: review.author,
      authorAvatar: review.avatar,
      text: review.text,
      createdAt: review.date,
      tripDate: review.tripDate,
      photos: review.photos,
    })),
    platformTourId: detail.id,
    platformDates: detail.dates.map((date) => ({
      id: date.id,
      startDate: date.startDate,
      endDate: date.endDate,
      spotsLeft: date.spotsLeft,
      priceUsd: date.priceUsd,
    })),
    platformBookingMode: detail.bookingMode,
    platformRequestDateFrom: detail.requestDateFrom,
    platformRequestDateTo: detail.requestDateTo,
    platformStartTime: detail.arrival.startTime || "10:00",
    platformEndTime: detail.arrival.finishTime,
  };
}

export function nativeExcursionCities(items: ExcursionListing[]): ExcursionCity[] {
  const cities = new Map<number, ExcursionCity>();
  for (const item of items) {
    const existing = cities.get(item.cityId);
    cities.set(item.cityId, {
      id: item.cityId,
      slug: item.citySlug,
      name: item.cityName,
      experienceCount: (existing?.experienceCount ?? 0) + 1,
      coverImage: existing?.coverImage ?? item.coverImage,
    });
  }
  return [...cities.values()];
}
