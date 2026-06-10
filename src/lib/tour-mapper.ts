import type { OrganizerTourDraft } from "@/types/organizer-tour";
import { DEFAULT_TOUR_CHECKOUT_PAYMENT_OPTIONS, normalizeTourCheckoutPaymentOptions } from "@/types/tour-checkout-payment";
import {
  normalizeParticipantRecommendations,
  normalizeRouteFeaturesText,
} from "@/data/tour-organizer-display-defaults";
import { enrichTourOrganizerDetail } from "@/lib/organizer-experience-enrich";
import { getOrganizerTourOwnerId } from "@/lib/organizer-tour-store";
import { DEFAULT_ORGANIZER_OWNER_ID } from "@/types/user";
import type {
  ChildrenPolicy,
  DurationBucket,
  GroupSizeBucket,
  TourAccommodation,
  TourArrivalInfo,
  TourDate,
  TourDescriptionExtra,
  TourDetail,
  TourItineraryDay,
  TourListing,
} from "@/types";
import type { Tour, TourOrganizerComment, TourStatus } from "@/types/tour";
import { primaryComfortLevel } from "@/data/tour-levels";
import { textToListItems } from "@/data/tour-terms-defaults";
import { linesToLogisticsList } from "@/data/tour-logistics-defaults";
import { getTourRoutePoints } from "@/data/tour-routes";
import { getLegacyTourDetail } from "@/lib/tours-legacy";

function buildOrganizerCommentFromDraft(
  draft: OrganizerTourDraft,
  fallback: TourOrganizerComment
): TourOrganizerComment {
  return {
    greeting: fallback.greeting,
    recommendations: normalizeParticipantRecommendations(draft.participantRecommendations),
    routeNotes: normalizeRouteFeaturesText(draft.routeFeaturesText),
  };
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

function childPolicy(minAge: number): ChildrenPolicy {
  if (minAge === 0) return "Без ограничений";
  if (minAge <= 2) return "От 2 лет";
  if (minAge <= 5) return "От 5 лет";
  if (minAge <= 8) return "От 8 лет";
  if (minAge <= 12) return "От 12 лет";
  if (minAge <= 16) return "От 16 лет";
  return "Только взрослые";
}

function draftStatusToTourStatus(draft: OrganizerTourDraft): TourStatus {
  if (draft.deleted) return "deleted";
  if (draft.archived) return "archived";
  if (draft.status === "draft") return "draft";
  return "published";
}

function descriptionBlocksFromText(shortDescription: string, longDescription?: string) {
  const blocks: Tour["descriptionBlocks"] = [];
  if (shortDescription.trim()) {
    blocks.push({ type: "paragraph", content: shortDescription.trim() });
  }
  if (longDescription?.trim()) {
    blocks.push({ type: "paragraph", content: longDescription.trim() });
  }
  return blocks;
}

function mapAccommodationPlacesToPublic(
  tour: Tour
): TourAccommodation[] {
  if (!tour.accommodation.places.length) return [];

  return tour.accommodation.places.map((place) => ({
    id: place.id,
    name: place.name || "Проживание",
    description: place.description || tour.accommodation.description || "",
    comfort: tour.levels.primaryComfort,
    amenities: [],
    images: place.images.length ? place.images : tour.accommodation.photos,
  }));
}

function mapProgramDaysToItinerary(days: Tour["program"]["days"]): TourItineraryDay[] {
  return days.map((day) => ({
    id: day.id,
    dayNumber: day.dayNumber,
    title: day.title || `День ${day.dayNumber}`,
    description: day.description,
    images: day.images,
    activities: [],
    meals: [],
    accommodation: "",
  }));
}

function buildArrivalInfo(tour: Tour): TourArrivalInfo {
  const { logistics, geography } = tour;
  const flights: string[] = [];

  if (logistics.ticketRecommendationsEnabled && logistics.ticketRecommendationsText.trim()) {
    flights.push(...linesToLogisticsList(logistics.ticketRecommendationsText));
  }

  const fallbackLocation = geography.startLocation || geography.mainLocation || "";
  const airports =
    logistics.arrivalDetailsEnabled && logistics.arrivalAirportsText.trim()
      ? linesToLogisticsList(logistics.arrivalAirportsText)
      : fallbackLocation
        ? [fallbackLocation]
        : [];

  const transfers =
    logistics.arrivalDetailsEnabled && logistics.arrivalTransfersText.trim()
      ? linesToLogisticsList(logistics.arrivalTransfersText)
      : [];

  const meetingPoint =
    logistics.arrivalDetailsEnabled && logistics.arrivalMeetingPoint.trim()
      ? logistics.arrivalMeetingPoint.trim()
      : fallbackLocation;

  return {
    airports,
    flights,
    transfers,
    meetingPoint,
  };
}

function buildDescriptionExtra(tour: Tour, fallback?: TourDescriptionExtra): TourDescriptionExtra {
  const packing =
    tour.terms.packingList?.enabled && tour.terms.packingList.text.trim()
      ? textToListItems(tour.terms.packingList.text)
      : fallback?.packing ?? [];

  return {
    difficulty: tour.levels.difficultyDescription?.trim() || fallback?.difficulty || "",
    seasonality: fallback?.seasonality ?? "",
    packing,
    flights:
      tour.logistics.ticketRecommendationsEnabled && tour.logistics.ticketRecommendationsText.trim()
        ? tour.logistics.ticketRecommendationsText.trim()
        : fallback?.flights ?? "",
    meals: fallback?.meals ?? "",
    comfort: tour.accommodation.description ?? fallback?.comfort ?? "",
    transfers: fallback?.transfers ?? "",
  };
}

function dayMonthToIso(dayMonth: string, year = new Date().getFullYear()): string | undefined {
  const match = dayMonth.trim().match(/^(\d{1,2})\.(\d{1,2})$/);
  if (!match) return undefined;
  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Build canonical Tour from marketplace listing + legacy detail page data. */
export function listingAndDetailToTour(listing: TourListing, detail: TourDetail): Tour {
  const primaryComfort = listing.comfortLevel;

  return {
    id: listing.id,
    slug: listing.slug,
    status: "published",
    type: "tour",
    display: {
      featured: listing.featured,
      badges: listing.badges,
      isHot: listing.isHot,
      isNew: listing.isNew,
      isBestOfMonth: listing.isBestOfMonth,
    },
    title: listing.title,
    shortDescription: listing.shortDescription,
    descriptionBlocks: detail.descriptionBlocks,
    geography: {
      countries: [detail.country],
      cities: [],
      touristRegions: [listing.region],
      landmarks: [],
      mainLocation: listing.destination,
      startLocation: detail.startLocation ?? listing.destination,
      destination: listing.destination,
      region: listing.region,
      country: detail.country,
      coordinates: { lat: listing.latitude, lng: listing.longitude },
    },
    durationDays: listing.durationDays,
    durationNights: listing.durationNights,
    pricing: {
      basePriceUsd: listing.priceUsd,
      originalPriceUsd: listing.originalPriceUsd,
      currency: "USD",
      priceFromPrefix: false,
      enabledDiscounts: [],
    },
    booking: {
      mode: listing.bookingMode ?? detail.bookingMode ?? "scheduled",
      groupDates: detail.dates.map((date) => ({
        id: date.id,
        startDate: date.startDate,
        endDate: date.endDate,
        priceUsd: date.priceUsd,
        totalSeats: detail.groupMax,
        spotsLeft: date.spotsLeft,
        fullPaymentDaysBefore: 0,
        prepaymentAmount: 15,
        prepaymentType: "percent",
        applyDiscount: false,
        notGuaranteed: false,
        flightIncluded: false,
      })),
      individual:
        listing.bookingMode === "on_request" || listing.bookingMode === "both"
          ? {
              enabled: true,
              periodFrom: listing.requestDateFrom ?? "",
              periodTo: listing.requestDateTo ?? "",
              priceUsd: listing.priceUsd,
            }
          : undefined,
      advantages: detail.bookingAdvantages ?? listing.bookingAdvantages ?? [],
      autoRollDatesToNextYear: false,
      checkoutPaymentOptions: { ...DEFAULT_TOUR_CHECKOUT_PAYMENT_OPTIONS },
    },
    classification: {
      primaryActivity: listing.activityType,
      activities: [listing.activityType],
      collections: [],
      tags: detail.tags,
    },
    levels: {
      difficulty: listing.difficultyLevel,
      comfortLevels: [primaryComfort],
      primaryComfort,
      accommodationType: listing.accommodationType,
    },
    participants: {
      groupMin: listing.groupSizeMin,
      groupMax: listing.groupSizeMax,
      minimumAge: listing.minimumAge,
      languages: listing.language,
    },
    accommodation: {
      description: detail.accommodations[0]?.description,
      photos: detail.accommodations.flatMap((item) => item.images),
      places: [],
    },
    program: {
      routeMapImage: "",
      routePoints: detail.routePoints ?? getTourRoutePoints(listing.slug),
      days: detail.itinerary.map((day) => ({
        id: day.id,
        dayNumber: day.dayNumber,
        title: day.title,
        description: day.description,
        images: day.images,
      })),
    },
    media: {
      coverImage: listing.image,
      gallery: listing.gallery,
      places: detail.places,
    },
    team: {
      guides: [],
      organizerPreview: listing.organizer,
      organizerDetail: detail.organizer,
      organizerComment: detail.organizerComment,
    },
    terms: {
      included: detail.included,
      excluded: detail.excluded,
      importantInfo: detail.importantInfo,
      faq: detail.faq,
    },
    logistics: {
      ticketRecommendationsEnabled: detail.arrival.flights.length > 0,
      ticketRecommendationsText: detail.arrival.flights.join("\n"),
      arrivalDepartureEnabled: false,
      arrivalDepartureCities: [],
      arrivalDetailsEnabled: true,
      arrivalAirportsText: detail.arrival.airports.join("\n"),
      arrivalTransfersText: detail.arrival.transfers.join("\n"),
      arrivalMeetingPoint: detail.arrival.meetingPoint,
    },
    social: {
      rating: listing.rating,
      reviewCount: listing.reviewCount,
      reviews: detail.reviews,
    },
  };
}

/** Merge organizer draft onto an existing canonical tour (pilot). */
export function organizerDraftToTour(draft: OrganizerTourDraft, base: Tour): Tour {
  const comfort = primaryComfortLevel(
    draft.comfortLevels?.length ? draft.comfortLevels : [draft.comfortLevel]
  );

  const included = textToListItems(draft.includedText);
  const excluded = textToListItems(draft.excludedText);

  const descriptionBlocks =
    draft.shortDescription.trim() || draft.description.trim()
      ? descriptionBlocksFromText(draft.shortDescription, draft.description)
      : base.descriptionBlocks;

  const authorGuide = draft.guides.find((guide) => guide.isTourAuthor) ?? draft.guides[0];

  return {
    ...base,
    organizerTourId: draft.id,
    status: draftStatusToTourStatus(draft),
    type: draft.type,
    isPreliminaryProgram: draft.isPreliminaryProgram,
    display: {
      ...base.display,
    },
    title: draft.title,
    shortDescription: draft.shortDescription,
    descriptionBlocks,
    geography: {
      countries: draft.countries.length ? draft.countries : [draft.country],
      cities: draft.cities,
      touristRegions: draft.touristRegions.length ? draft.touristRegions : [draft.region],
      landmarks: draft.landmarks,
      mainLocation: draft.mainLocation || draft.destination,
      startLocation: draft.mapStartPoint || draft.startLocation,
      destination: draft.mainLocation || draft.destination,
      region: draft.touristRegions[0] ?? draft.region,
      country: draft.countries[0] ?? draft.country,
      coordinates: base.geography.coordinates,
    },
    durationDays: draft.durationDays,
    durationNights: draft.durationNights,
    pricing: {
      basePriceUsd: draft.priceUsd,
      originalPriceUsd: draft.originalPriceUsd ?? undefined,
      currency: draft.priceCurrency,
      priceFromPrefix: draft.priceFromPrefix,
      enabledDiscounts: draft.enabledDiscounts,
    },
    booking: {
      mode: draft.bookingMode,
      groupDates: draft.groupTourDates,
      individual: draft.individualTourEnabled
        ? {
            enabled: true,
            periodFrom: draft.individualPeriodFrom,
            periodTo: draft.individualPeriodTo,
            priceUsd: draft.individualPriceUsd,
          }
        : undefined,
      advantages: base.booking.advantages,
      autoRollDatesToNextYear: draft.autoRollGroupDatesToNextYear,
      checkoutPaymentOptions: normalizeTourCheckoutPaymentOptions(
        draft.checkoutPaymentOptions ?? base.booking.checkoutPaymentOptions
      ),
    },
    classification: {
      primaryActivity: draft.activityType,
      activities: draft.tourActivities.length ? draft.tourActivities : [draft.activityType],
      collections: draft.collections,
      tags: base.classification.tags,
    },
    levels: {
      difficulty: draft.difficultyLevel,
      difficultyDescription: draft.difficultyDescriptionText || undefined,
      comfortLevels: draft.comfortLevels.length ? draft.comfortLevels : [comfort],
      primaryComfort: comfort,
      accommodationType: draft.accommodationType,
    },
    participants: {
      groupMin: draft.groupMin,
      groupMax: draft.groupMax,
      minimumAge: draft.minimumAge,
      maximumAge: draft.maximumAge,
      maxWeightEnabled: draft.maxWeightEnabled,
      maxWeightKg: draft.maxWeightKg,
      languages: draft.languages,
    },
    accommodation: {
      description: draft.accommodationDescriptionText || base.accommodation.description,
      photos: draft.accommodationPhotos,
      places: draft.accommodationPlaces,
    },
    program: {
      routeMapImage: draft.routeMapImage,
      routePoints: base.program.routePoints,
      days: draft.programDays,
    },
    media: {
      coverImage: draft.image,
      gallery: draft.gallery.length ? draft.gallery : [draft.image],
      places: draft.places,
    },
    team: {
      guides: draft.guides,
      organizerPreview: authorGuide
        ? { name: authorGuide.name, avatar: authorGuide.avatar }
        : base.team.organizerPreview,
      organizerDetail: authorGuide
        ? {
            ...base.team.organizerDetail,
            name: authorGuide.name,
            avatar: authorGuide.avatar,
            languages: draft.languages,
          }
        : base.team.organizerDetail,
      organizerComment: buildOrganizerCommentFromDraft(draft, base.team.organizerComment),
    },
    terms: {
      included: included.length ? included : base.terms.included,
      excluded: excluded.length ? excluded : base.terms.excluded,
      importantInfo: draft.importantInfo.length ? draft.importantInfo : base.terms.importantInfo,
      faq: draft.faq.length ? draft.faq : base.terms.faq,
      packingList: {
        enabled: draft.packingListEnabled,
        text: draft.packingListText,
      },
      insurance: {
        type: draft.insuranceType,
        description: draft.insuranceDescription,
      },
      cancellation: {
        useTemplate: draft.useCancellationTemplate,
        customText: draft.customCancellationText,
      },
    },
    logistics: {
      ticketRecommendationsEnabled: draft.ticketRecommendationsEnabled,
      ticketRecommendationsText: draft.ticketRecommendationsText,
      arrivalDepartureEnabled: draft.arrivalDepartureEnabled,
      arrivalDepartureCities: draft.arrivalDepartureCities,
      arrivalDetailsEnabled: draft.arrivalDetailsEnabled,
      arrivalAirportsText: draft.arrivalAirportsText,
      arrivalTransfersText: draft.arrivalTransfersText,
      arrivalMeetingPoint: draft.arrivalMeetingPoint,
    },
    partnerName: draft.partnerName,
    coverLabel: draft.coverLabel,
    updatedAt: draft.updatedAt,
  };
}

export function tourToListing(tour: Tour): TourListing {
  const availableDates: TourDate[] = tour.booking.groupDates
    .filter((date) => date.startDate && date.endDate)
    .map((date) => ({
      start: date.startDate,
      end: date.endDate,
      spotsLeft: date.spotsLeft,
    }));

  const listingDates =
    availableDates.length > 0
      ? availableDates
      : getLegacyTourDetail(tour.slug)?.dates.map((date) => ({
          start: date.startDate,
          end: date.endDate,
          spotsLeft: date.spotsLeft,
        })) ?? [];

  const coords = tour.geography.coordinates ?? { lat: -34.6, lng: -58.4 };

  return {
    id: tour.id,
    slug: tour.slug,
    title: tour.title,
    shortDescription: tour.shortDescription,
    image: tour.media.coverImage,
    gallery: tour.media.gallery,
    destination: tour.geography.destination,
    region: tour.geography.region,
    activityType: tour.classification.primaryActivity,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    durationBucket: durationBucket(tour.durationDays),
    priceUsd: tour.pricing.basePriceUsd,
    originalPriceUsd: tour.pricing.originalPriceUsd,
    bookingMode: tour.booking.mode,
    requestDateFrom: tour.booking.individual?.periodFrom,
    requestDateTo: tour.booking.individual?.periodTo,
    bookingAdvantages: tour.booking.advantages,
    accommodationType: tour.levels.accommodationType,
    comfortLevel: tour.levels.primaryComfort,
    difficultyLevel: tour.levels.difficulty,
    language: tour.participants.languages,
    childrenAllowed: childPolicy(tour.participants.minimumAge),
    minimumAge: tour.participants.minimumAge,
    groupSizeMin: tour.participants.groupMin,
    groupSizeMax: tour.participants.groupMax,
    groupSizeBucket: groupBucket(tour.participants.groupMin, tour.participants.groupMax),
    availableDates: listingDates,
    latitude: coords.lat,
    longitude: coords.lng,
    rating: tour.social.rating,
    reviewCount: tour.social.reviewCount,
    organizer: tour.team.organizerPreview,
    badges: tour.display.badges,
    isHot: tour.display.isHot,
    isNew: tour.display.isNew,
    isBestOfMonth: tour.display.isBestOfMonth,
    featured: tour.display.featured,
  };
}

export interface TourDetailEnrichment {
  descriptionExtra?: TourDescriptionExtra;
}

export function tourToDetail(tour: Tour, enrichment?: TourDetailEnrichment): TourDetail {
  const legacy = getLegacyTourDetail(tour.slug);
  const fallbackExtra = enrichment?.descriptionExtra ?? legacy?.descriptionExtra;

  const dates =
    tour.booking.groupDates.filter((date) => date.startDate).length > 0
      ? tour.booking.groupDates
          .filter((date) => date.startDate)
          .map((date) => ({
            id: date.id,
            startDate: date.startDate,
            endDate: date.endDate,
            spotsLeft: date.spotsLeft,
            priceUsd: date.priceUsd || tour.pricing.basePriceUsd,
          }))
      : legacy?.dates ?? [];

  const accommodations = mapAccommodationPlacesToPublic(tour);
  const publicAccommodations =
    accommodations.length > 0 ? accommodations : legacy?.accommodations ?? [];

  return {
    id: tour.id,
    slug: tour.slug,
    title: tour.title,
    country: tour.geography.country,
    region: tour.geography.region,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    priceUsd: tour.pricing.basePriceUsd,
    originalPriceUsd: tour.pricing.originalPriceUsd,
    rating: tour.social.rating,
    reviewCount: tour.social.reviewCount,
    gallery: tour.media.gallery,
    image: tour.media.coverImage,
    shortDescription: tour.shortDescription,
    difficulty: tour.levels.difficulty,
    comfort: tour.levels.primaryComfort,
    accommodationType: tour.levels.accommodationType,
    groupMin: tour.participants.groupMin,
    groupMax: tour.participants.groupMax,
    minimumAge: tour.participants.minimumAge,
    startLocation: tour.geography.startLocation,
    bookingMode: tour.booking.mode,
    requestDateFrom:
      dayMonthToIso(tour.booking.individual?.periodFrom ?? "") ??
      legacy?.requestDateFrom,
    requestDateTo:
      dayMonthToIso(tour.booking.individual?.periodTo ?? "") ?? legacy?.requestDateTo,
    bookingAdvantages: tour.booking.advantages,
    places: tour.media.places.length ? tour.media.places : legacy?.places ?? [],
    routePoints: tour.program.routePoints.length
      ? tour.program.routePoints
      : legacy?.routePoints,
    descriptionBlocks: tour.descriptionBlocks.length
      ? tour.descriptionBlocks
      : legacy?.descriptionBlocks ?? [],
    descriptionExtra: buildDescriptionExtra(tour, fallbackExtra),
    itinerary: tour.program.days.length
      ? mapProgramDaysToItinerary(tour.program.days)
      : legacy?.itinerary ?? [],
    organizerComment: tour.team.organizerComment,
    organizer: enrichTourOrganizerDetail(
      tour.team.organizerDetail,
      tour.organizerTourId
        ? getOrganizerTourOwnerId(tour.organizerTourId)
        : DEFAULT_ORGANIZER_OWNER_ID
    ),
    reviews: tour.social.reviews,
    accommodations: publicAccommodations,
    included: tour.terms.included,
    excluded: tour.terms.excluded,
    arrival: buildArrivalInfo(tour),
    importantInfo: tour.terms.importantInfo,
    faq: tour.terms.faq,
    dates,
    tags: tour.classification.tags,
    featured: tour.display.featured,
    checkoutPaymentOptions: tour.booking.checkoutPaymentOptions,
  };
}

export function isTourPublishedListing(tour: Tour): boolean {
  return tour.status === "published";
}

export function isTourPubliclyVisible(tour: Tour): boolean {
  return tour.status === "published";
}

/** Minimal canonical tour for organizer-created listings without marketplace seed. */
export function createMinimalTourFromDraft(
  draft: OrganizerTourDraft,
  catalogSlug: string
): Tour {
  const comfort = primaryComfortLevel(
    draft.comfortLevels?.length ? draft.comfortLevels : [draft.comfortLevel]
  );
  const included = textToListItems(draft.includedText);
  const excluded = textToListItems(draft.excludedText);

  return {
    id: draft.id,
    slug: catalogSlug,
    organizerTourId: draft.id,
    status: draftStatusToTourStatus(draft),
    type: draft.type,
    isPreliminaryProgram: draft.isPreliminaryProgram,
    display: { badges: [] },
    title: draft.title,
    shortDescription: draft.shortDescription,
    descriptionBlocks: descriptionBlocksFromText(draft.shortDescription, draft.description),
    geography: {
      countries: draft.countries.length ? draft.countries : [draft.country || "Аргентина"],
      cities: draft.cities,
      touristRegions: draft.touristRegions.length ? draft.touristRegions : [draft.region].filter(Boolean),
      landmarks: draft.landmarks,
      mainLocation: draft.mainLocation || draft.destination,
      startLocation: draft.mapStartPoint || draft.startLocation,
      destination: draft.mainLocation || draft.destination,
      region: draft.touristRegions[0] ?? draft.region,
      country: draft.countries[0] ?? draft.country ?? "Аргентина",
      coordinates: { lat: -34.6037, lng: -58.3816 },
    },
    durationDays: draft.durationDays,
    durationNights: draft.durationNights,
    pricing: {
      basePriceUsd: draft.priceUsd,
      originalPriceUsd: draft.originalPriceUsd ?? undefined,
      currency: draft.priceCurrency,
      priceFromPrefix: draft.priceFromPrefix,
      enabledDiscounts: draft.enabledDiscounts,
    },
    booking: {
      mode: draft.bookingMode,
      groupDates: draft.groupTourDates,
      individual: draft.individualTourEnabled
        ? {
            enabled: true,
            periodFrom: draft.individualPeriodFrom,
            periodTo: draft.individualPeriodTo,
            priceUsd: draft.individualPriceUsd,
          }
        : undefined,
      advantages: [],
      autoRollDatesToNextYear: draft.autoRollGroupDatesToNextYear,
      checkoutPaymentOptions: normalizeTourCheckoutPaymentOptions(draft.checkoutPaymentOptions),
    },
    classification: {
      primaryActivity: draft.activityType,
      activities: draft.tourActivities.length ? draft.tourActivities : [draft.activityType],
      collections: draft.collections,
      tags: [],
    },
    levels: {
      difficulty: draft.difficultyLevel,
      difficultyDescription: draft.difficultyDescriptionText || undefined,
      comfortLevels: draft.comfortLevels.length ? draft.comfortLevels : [comfort],
      primaryComfort: comfort,
      accommodationType: draft.accommodationType,
    },
    participants: {
      groupMin: draft.groupMin,
      groupMax: draft.groupMax,
      minimumAge: draft.minimumAge,
      maximumAge: draft.maximumAge,
      maxWeightEnabled: draft.maxWeightEnabled,
      maxWeightKg: draft.maxWeightKg,
      languages: draft.languages,
    },
    accommodation: {
      description: draft.accommodationDescriptionText,
      photos: draft.accommodationPhotos,
      places: draft.accommodationPlaces,
    },
    program: {
      routeMapImage: draft.routeMapImage,
      routePoints: getTourRoutePoints(catalogSlug),
      days: draft.programDays,
    },
    media: {
      coverImage: draft.image,
      gallery: draft.gallery.length ? draft.gallery : [draft.image],
      places: draft.places,
    },
    team: {
      guides: draft.guides,
      organizerPreview: { name: draft.partnerName, avatar: draft.image },
      organizerDetail: {
        id: draft.id,
        name: draft.partnerName,
        role: "Организатор путешествия",
        avatar: draft.image,
        rating: 0,
        tourCount: 0,
        travelerCount: 0,
        languages: draft.languages,
        experienceYears: 0,
        phone: "",
        email: "",
      },
      organizerComment: buildOrganizerCommentFromDraft(draft, {
        greeting: "",
        recommendations: [],
        routeNotes: "",
      }),
    },
    terms: {
      included,
      excluded,
      importantInfo: draft.importantInfo,
      faq: draft.faq,
      packingList: {
        enabled: draft.packingListEnabled,
        text: draft.packingListText,
      },
      insurance: {
        type: draft.insuranceType,
        description: draft.insuranceDescription,
      },
      cancellation: {
        useTemplate: draft.useCancellationTemplate,
        customText: draft.customCancellationText,
      },
    },
    logistics: {
      ticketRecommendationsEnabled: draft.ticketRecommendationsEnabled,
      ticketRecommendationsText: draft.ticketRecommendationsText,
      arrivalDepartureEnabled: draft.arrivalDepartureEnabled,
      arrivalDepartureCities: draft.arrivalDepartureCities,
      arrivalDetailsEnabled: draft.arrivalDetailsEnabled,
      arrivalAirportsText: draft.arrivalAirportsText,
      arrivalTransfersText: draft.arrivalTransfersText,
      arrivalMeetingPoint: draft.arrivalMeetingPoint,
    },
    social: {
      rating: 0,
      reviewCount: 0,
      reviews: [],
    },
    partnerName: draft.partnerName,
    coverLabel: draft.coverLabel,
    updatedAt: draft.updatedAt,
  };
}

export function buildSeedTourFromSlug(slug: string, listing: TourListing): Tour | null {
  const detail = getLegacyTourDetail(slug);
  if (!detail) return null;
  return listingAndDetailToTour(listing, detail);
}
