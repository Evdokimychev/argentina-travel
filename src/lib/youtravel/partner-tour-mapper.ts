import { htmlToPlainText, isHtmlContent, plainTextFromRichContent, sanitizeHtml, escapeHtml } from "@/lib/rich-text";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import {
  buildYouTravelPartnerContent,
  resolveYouTravelDayPhotos,
  resolveYouTravelGallery,
  resolveYouTravelMediaUrl,
  resolveYouTravelProgram,
} from "@/lib/youtravel/partner-tour-content";
import {
  mapYouTravelExpertToGuideProfile,
  resolveYouTravelExpert,
  resolveYouTravelExpertRating,
  resolveYouTravelExpertReviewCount,
  resolveYouTravelExpertTourCount,
} from "@/lib/youtravel/partner-tour-guide";
import { mapYouTravelActivityToDifficulty } from "@/lib/youtravel/activity-levels";
import { mapYouTravelComfortToComfortLevel } from "@/lib/youtravel/partner-levels";
import { mapYouTravelAccommodations } from "@/lib/youtravel/partner-tour-accommodation";
import { resolveYouTravelTravelersGoing } from "@/lib/youtravel/partner-tour-details";
import {
  resolveYouTravelDayLocationNames,
  resolveYouTravelRoutePoints,
} from "@/lib/youtravel/partner-tour-route";
import { mapYouTravelOffersToTourDates } from "@/lib/youtravel/offers-mapper";
import { formatYouTravelListedPrice } from "@/lib/youtravel/offers-mapper";
import { parseYouTravelOfferDate } from "@/lib/youtravel/response";
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
    const rawDescription =
      day.description?.trim() || day.text?.trim() || day.content?.trim() || "";
    const descriptionHtml =
      rawDescription && isHtmlContent(rawDescription) ? sanitizeHtml(rawDescription) : undefined;
    const routeLocationNames = resolveYouTravelDayLocationNames(day);

    return {
      id: `yt-day-${dayNumber}`,
      dayNumber,
      title,
      description: descriptionHtml
        ? htmlToPlainText(descriptionHtml)
        : plainTextFromRichContent(rawDescription),
      descriptionHtml,
      ...(routeLocationNames.length ? { routeLocationNames } : {}),
      images: resolveYouTravelDayPhotos(day),
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
      const start = parseYouTravelOfferDate(offer.startDate ?? offer.dateFrom ?? offer.date);
      if (!start) return null;
      const end =
        parseYouTravelOfferDate(offer.endDate ?? offer.dateTo ?? offer.dateFrom ?? offer.startDate) ??
        start;
      const spots =
        offer.freeSpaces ?? offer.seatsAvailable ?? offer.placesLeft ?? offer.seatsTotal ?? 0;
      return {
        start,
        end,
        spotsLeft: Math.max(spots, 0),
      };
    })
    .filter((item): item is TourDate => item != null)
    .sort((a, b) => a.start.localeCompare(b.start));
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

  const partnerContent = {
    ...buildYouTravelPartnerContent(payload, row),
    travelersGoingCount: resolveYouTravelTravelersGoing(payload, options?.offers),
  };
  const expert = resolveYouTravelExpert(payload);
  const partnerGuideProfile = expert ? mapYouTravelExpertToGuideProfile(expert) : undefined;
  const expertRating = resolveYouTravelExpertRating(expert);
  const expertReviewCount = resolveYouTravelExpertReviewCount(expert);
  const expertTourCount = resolveYouTravelExpertTourCount(expert);
  const expertId = expert?.id != null ? String(expert.id) : "youtravel";
  const expertSlug =
    expert?.id != null ? `youtravel-expert-${expert.id}` : listing.organizer.slug;
  const personalNotes = expert?.personal_notes?.trim();
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
  const routePoints = resolveYouTravelRoutePoints(payload);
  const datePrices = mapYouTravelOffersToTourDates({
    tourId: row.id,
    offers: options?.offers ?? [],
    fallbackPriceUsd: listing.priceUsd,
    fallbackCurrency: listing.partnerPriceCurrency,
    fallbackPriceValue: listing.partnerPriceValue,
  });
  const dates = mapOffersToDates(options?.offers ?? []);
  const activityDifficulty =
    partnerContent.activityLevel != null
      ? mapYouTravelActivityToDifficulty(
          partnerContent.activityLevel as 1 | 2 | 3 | 4 | 5
        )
      : listing.difficultyLevel;
  const comfortLevel =
    partnerContent.comfortLevel != null
      ? mapYouTravelComfortToComfortLevel(partnerContent.comfortLevel)
      : listing.comfortLevel;
  const accommodations = mapYouTravelAccommodations(partnerContent, payload);
  const itineraryOrganizerComment = partnerContent.activityExpertComment?.trim() || undefined;
  const minimumAgeRaw = payload.age_from ?? payload.ageFrom;
  const minimumAge =
    minimumAgeRaw != null && Number.isFinite(Number(minimumAgeRaw))
      ? Number(minimumAgeRaw)
      : listing.minimumAge;

  return {
    ...listing,
    gallery: gallery.length ? gallery : listing.gallery,
    image: gallery[0] ?? listing.image,
    country: listing.country ?? listing.region,
    difficulty: activityDifficulty,
    comfort: comfortLevel,
    minimumAge,
    groupMin: listing.groupSizeMin,
    groupMax: listing.groupSizeMax,
    places: [],
    descriptionBlocks: mapDescriptionBlocks(payload, partnerContent),
    routePoints,
    descriptionExtra: {
      difficulty: "",
      seasonality: "",
      packing: [],
      flights: "",
      meals: "",
      comfort: partnerContent.comfortDescription
        ? `<p>${escapeHtml(partnerContent.comfortDescription)}</p>`
        : partnerContent.comfortHtml
          ? htmlToPlainText(partnerContent.comfortHtml)
          : "",
      transfers: partnerContent.meetingPoint ?? "",
    },
    itinerary,
    itineraryOrganizerComment,
    organizerComment: {
      greeting: expert?.name
        ? `Тур проводит ${expert.name} — тревел-эксперт на YouTravel.me.`
        : "Тур размещён на платформе YouTravel.me.",
      recommendations: [],
      routeNotes: partnerContent.finishPoint ? `Финиш: ${partnerContent.finishPoint}` : "",
    },
    organizer: {
      id: expertId,
      name: expert?.name ?? expert?.fullName ?? "YouTravel.me",
      role: "Тревел-эксперт YouTravel.me",
      avatar:
        partnerGuideProfile?.avatar ??
        resolveYouTravelMediaUrl(expert?.avatar) ??
        resolveYouTravelMediaUrl(expert?.photo) ??
        "",
      shortDescription:
        "Авторский многодневный тур. Бронирование оформляется на YouTravel.me.",
      extendedDescription: personalNotes || undefined,
      rating: expertRating > 0 ? expertRating : listing.rating,
      reviewCount: expertReviewCount > 0 ? expertReviewCount : listing.reviewCount,
      tourCount: expertTourCount > 0 ? expertTourCount : 1,
      travelerCount: 0,
      languages: partnerContent.languages ?? ["Русский"],
      experienceYears: 0,
      platformRegisteredAt:
        expert?.registered_at?.trim() || expert?.guide_since?.trim() || undefined,
      phone: "",
      email: "",
      slug: expertSlug,
    },
    partnerGuideProfile: partnerGuideProfile ?? undefined,
    reviews: options?.reviews ?? [],
    accommodations,
    included,
    excluded,
    arrival: {
      airports: [],
      flights: [],
      transfers: [],
      meetingPoint: partnerContent.meetingPoint ?? "",
      finishPoint: partnerContent.finishPoint ?? partnerContent.arrivalInfo?.finishCity,
      startTime: partnerContent.arrivalInfo?.startTime,
      finishTime: partnerContent.arrivalInfo?.finishTime,
    },
    importantInfo,
    faq: [],
    dates: datePrices.length
      ? datePrices
      : dates.map((date, index) => ({
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
