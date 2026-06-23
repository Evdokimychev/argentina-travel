import { htmlToPlainText } from "@/lib/rich-text";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import {
  buildYouTravelPartnerContent,
  resolveYouTravelGallery,
  resolveYouTravelProgram,
} from "@/lib/youtravel/partner-tour-content";
import { formatYouTravelListedPrice } from "@/lib/youtravel/offers-mapper";
import { youtravelTourListingId } from "@/lib/youtravel/partner-tour-utils";
import type { YouTravelOffer, YouTravelProgramDay, YouTravelTour } from "@/lib/youtravel/types";
import type {
  RichTextBlock,
  TourDate,
  TourDetail,
  TourItineraryDay,
  TourListing,
  TourReview,
} from "@/types";
import type { YouTravelTourRow } from "@/lib/youtravel/partner-tour-repository";
import { rowToListing } from "@/lib/youtravel/partner-tour-repository";

function mapProgramDays(payload: YouTravelTour): TourItineraryDay[] {
  const program = resolveYouTravelProgram(payload) as YouTravelProgramDay[];
  if (!program.length) return [];

  return program.map((day, index) => {
    const dayNumber = day.day ?? day.dayNumber ?? index + 1;
    const title = day.title?.trim() || day.name?.trim() || `День ${dayNumber}`;
    const description =
      day.description?.trim() || day.text?.trim() || day.content?.trim() || "";
    return {
      id: `yt-day-${dayNumber}`,
      dayNumber,
      title,
      description,
      images: [],
      activities: [],
      meals: [],
      accommodation: "",
    };
  });
}

function mapDescriptionBlocks(payload: YouTravelTour, content: PartnerTourContent): RichTextBlock[] {
  if (content.introHtml) {
    return [{ type: "paragraph", content: htmlToPlainText(content.introHtml) }];
  }

  const summary = content.summary?.trim();
  if (summary) return [{ type: "paragraph", content: summary }];
  return [];
}

function mapOffersToDates(offers: YouTravelOffer[]): TourDate[] {
  return offers
    .map((offer) => {
      const start = offer.startDate ?? offer.date;
      if (!start) return null;
      const end = offer.endDate ?? start;
      const spots =
        offer.seatsAvailable ?? offer.placesLeft ?? offer.seatsTotal ?? 0;
      return {
        start: String(start).slice(0, 10),
        end: String(end).slice(0, 10),
        spotsLeft: Math.max(spots, 0),
      };
    })
    .filter((item): item is TourDate => item != null)
    .sort((a, b) => a.start.localeCompare(b.start));
}

function resolveExpert(payload: YouTravelTour) {
  return payload.expert ?? payload.organizer ?? payload.travelExpert ?? null;
}

export function youtravelRowToListing(row: YouTravelTourRow): TourListing {
  return rowToListing(row);
}

export function youtravelRowToDetail(
  row: YouTravelTourRow,
  options?: { offers?: YouTravelOffer[]; reviews?: TourReview[] }
): TourDetail {
  const payload = (row.payload ?? {}) as YouTravelTour;
  const gallery = resolveYouTravelGallery(payload, row.photos);
  const listing = rowToListing({
    ...row,
    cover_image: row.cover_image ?? gallery[0] ?? null,
    photos: gallery,
    price_display:
      row.price_display ??
      formatYouTravelListedPrice(row.price_value, row.price_currency) ??
      null,
  });

  const partnerContent = buildYouTravelPartnerContent(payload, row);
  const expert = resolveExpert(payload);
  const included = partnerContent.includedHtml
    ? htmlToPlainText(partnerContent.includedHtml)
      .split("\n")
      .map((item) => item.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean)
    : [];
  const excluded = partnerContent.excludedHtml
    ? htmlToPlainText(partnerContent.excludedHtml)
      .split("\n")
      .map((item) => item.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean)
    : [];
  const importantInfo = partnerContent.additionalInfoHtml
    ? htmlToPlainText(partnerContent.additionalInfoHtml)
      .split("\n")
      .map((item) => item.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean)
    : [];

  const itinerary = mapProgramDays(payload);
  const dates = mapOffersToDates(options?.offers ?? []);

  return {
    ...listing,
    gallery: gallery.length ? gallery : listing.gallery,
    image: gallery[0] ?? listing.image,
    country: listing.country ?? listing.region,
    difficulty: listing.difficultyLevel,
    comfort: listing.comfortLevel,
    groupMin: listing.groupSizeMin,
    groupMax: listing.groupSizeMax,
    places: [],
    descriptionBlocks: mapDescriptionBlocks(payload, partnerContent),
    routePoints: [],
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
      greeting: expert?.name
        ? `Тур проводит ${expert.name} — тревел-эксперт на YouTravel.me.`
        : "Тур размещён на платформе YouTravel.me.",
      recommendations: [],
      routeNotes: partnerContent.finishPoint ? `Финиш: ${partnerContent.finishPoint}` : "",
    },
    organizer: {
      id: expert?.id ? String(expert.id) : "youtravel",
      name: expert?.name ?? expert?.fullName ?? "YouTravel.me",
      role: "Тревел-эксперт YouTravel.me",
      avatar: expert?.avatar ?? expert?.photo ?? "",
      shortDescription:
        "Авторский многодневный тур. Бронирование оформляется на YouTravel.me.",
      rating: listing.rating,
      tourCount: 1,
      travelerCount: 0,
      languages: partnerContent.languages ?? ["Русский"],
      experienceYears: 0,
      phone: "",
      email: "",
      slug: expert?.slug ?? listing.organizer.slug,
    },
    reviews: options?.reviews ?? [],
    accommodations: [],
    included,
    excluded,
    arrival: {
      airports: [],
      flights: [],
      transfers: [],
      meetingPoint: partnerContent.meetingPoint ?? "",
    },
    importantInfo,
    faq: [],
    dates: dates.map((date, index) => ({
      id: `yt-offer-${row.id}-${index}`,
      startDate: date.start,
      endDate: date.end,
      spotsLeft: date.spotsLeft,
      priceUsd: listing.priceUsd,
      partnerPriceValue: listing.partnerPriceValue,
      partnerPriceCurrency: listing.partnerPriceCurrency,
    })),
    tags: ["YouTravel.me", "Партнёрский тур"],
    customBookingLink: {
      url: `/api/affiliate/go/${row.slug}`,
      label: "Забронировать на YouTravel.me",
      openInNewTab: true,
      passContext: true,
      hint: "Выберите дату и число туристов — мы перенаправим на YouTravel.me с партнёрской меткой.",
    },
    partnerSource: "youtravel",
    partnerExperienceId: row.id,
    partnerPriceDisplay: listing.partnerPriceDisplay ?? partnerContent.priceDescription,
    partnerPriceValue: listing.partnerPriceValue,
    partnerPriceCurrency: listing.partnerPriceCurrency,
    partnerPriceUnit: listing.partnerPriceUnit,
    partnerContent,
  };
}

export function parseYouTravelTourSlug(slug: string): number | null {
  const match = slug.trim().match(/-yt(\d+)$/i);
  if (!match) return null;
  const id = Number.parseInt(match[1], 10);
  return Number.isFinite(id) ? id : null;
}

export function isYouTravelTourSlug(slug: string): boolean {
  return parseYouTravelTourSlug(slug) != null;
}

export function youtravelListingIdFromSlug(slug: string): string | null {
  const id = parseYouTravelTourSlug(slug);
  return id != null ? youtravelTourListingId(id) : null;
}
