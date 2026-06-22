import { ORGANIZER_TOUR_LISTINGS } from "@/data/organizer-tours";
import { marketplaceTours } from "@/data/marketplace-tours";
import { getPrivateTourSeedForSlug } from "@/data/tour-private-seeds";
import { getWaitlistSeedForSlug } from "@/data/tour-waitlist-seeds";
import { getPriceOnRequestSeedForSlug } from "@/data/tour-price-on-request-seeds";
import { getGroupDiscountSeedForSlug } from "@/data/tour-group-discount-seeds";
import { mergeLogisticsSeed } from "@/data/tour-logistics-seeds";
import { applyOrganizerSeedOverrides } from "@/data/tour-organizer-seeds";
import { getTourDetail } from "@/lib/tours";
import { ORGANIZER_TOUR_GENERAL_DESCRIPTION_MAX } from "@/data/tour-description-defaults";
import { normalizeImpressions } from "@/data/tour-impressions-defaults";
import { createDefaultTourGuides } from "@/data/tour-guides-defaults";
import {
  ORGANIZER_TOUR_ACCOMMODATION_DESCRIPTION_MAX,
  mapTourAccommodationToPlace,
  normalizeAccommodationPlace,
} from "@/data/tour-accommodation-defaults";
import { getAccommodationSeedForSlug, mergeAccommodationSeedPlaces } from "@/data/tour-accommodation-seeds";
import { mergeGroupDatesSeed } from "@/data/tour-date-price-seeds";
import { getCustomBookingSeedForSlug } from "@/data/tour-custom-booking-seeds";
import {
  createDefaultCustomBookingLink,
  normalizeCustomBookingLink,
} from "@/lib/tour-custom-booking-link";
import { primaryComfortLevel } from "@/data/tour-levels";
import { buildGeographySeed } from "@/data/tour-geography";
import { normalizeGroupDiscountSettings } from "@/lib/group-discount";
import { generatePrivateAccessToken } from "@/lib/tour-private-access";
import { getTourRoutePoints } from "@/data/tour-routes";
import { normalizeRoutePoints } from "@/data/tour-route-defaults";
import { NO_ACCOMMODATION_LABEL, tourHasAccommodation } from "@/lib/tour-accommodation";
import {
  isoToDayMonth,
  mapTourDatePriceToGroupDate,
  normalizeGroupTourDate,
} from "@/data/tour-booking-defaults";
import {
  createEmptyProgramDay,
  mapItineraryToProgramDay,
  normalizeProgramDay,
  normalizeProgramDays,
  renumberProgramDays,
} from "@/data/tour-program-defaults";
import { normalizeTravelRisks } from "@/lib/tour-travel-risk";
import {
  ORGANIZER_TOUR_INSURANCE_DESCRIPTION_MAX,
  ORGANIZER_TOUR_CANCELLATION_TEXT_MAX,
  ORGANIZER_TOUR_PACKING_LIST_MAX,
  listItemsToText,
  normalizeFaqItems,
  normalizeTermsItems,
  textToListItems,
} from "@/data/tour-terms-defaults";
import { normalizeArrivalDepartureCities } from "@/data/tour-logistics-defaults";
import {
  ORGANIZER_TOUR_TITLE_MAX,
  ORGANIZER_TOURS_UPDATED_EVENT,
  type OrganizerTourDraft,
  type OrganizerTourListing,
} from "@/types/organizer-tour";
import { DEFAULT_TOUR_CHECKOUT_PAYMENT_OPTIONS, normalizeTourCheckoutPaymentOptions } from "@/types/tour-checkout-payment";
import {
  normalizeParticipantRecommendations,
  normalizeRouteFeaturesText,
  normalizeItineraryOrganizerComment,
  normalizeAccommodationOrganizerComment,
} from "@/data/tour-organizer-display-defaults";
import type { TourLanguage } from "@/types";
import {
  mergeSectionOrganizerComments,
  normalizeSectionOrganizerComments,
} from "@/lib/tour-section-comments";
import { fireOrganizerTourSync } from "@/lib/tour-content-api";
import {
  markTourDeletedBySlug,
  upsertTourFromOrganizerDraft,
} from "@/lib/tour-repository";
import {
  collectTakenCatalogSlugs,
  createOrganizerTourId,
  generateUniqueTourSlug,
  getCatalogSlug,
} from "@/lib/tour-slug";
import { evaluatePublishReadiness } from "@/lib/publish-readiness";
import {
  assertPermission,
  canCreateTour,
  canDeleteTour,
  canEditTour,
} from "@/lib/permissions";
import type { SessionUser } from "@/types/user";
import { DEFAULT_ORGANIZER_OWNER_ID } from "@/types/user";
import { tourCover } from "@/lib/seed-media";

const DRAFTS_KEY = "argentina-travel-organizer-tour-drafts";
const LISTINGS_KEY = "argentina-travel-organizer-tour-listings";
const DEFAULT_TOUR_IMAGE = tourCover("patagonia-glaciers");

function readDraftMap(): Record<string, OrganizerTourDraft> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, OrganizerTourDraft>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeDraftMap(drafts: Record<string, OrganizerTourDraft>) {
  window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

function readListingsMap(): Record<string, OrganizerTourListing> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(LISTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, OrganizerTourListing>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeListingsMap(listings: Record<string, OrganizerTourListing>) {
  window.localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
}

function mergeSeedListing(seed: OrganizerTourListing): OrganizerTourListing {
  const overrides = readListingsMap();
  const merged = overrides[seed.id] ? { ...seed, ...overrides[seed.id] } : seed;
  return {
    ...merged,
    ownerUserId: merged.ownerUserId ?? seed.ownerUserId ?? DEFAULT_ORGANIZER_OWNER_ID,
  };
}

export function resolveOwnerUserId(listing: Pick<OrganizerTourListing, "ownerUserId">): string {
  return listing.ownerUserId ?? DEFAULT_ORGANIZER_OWNER_ID;
}

export function getOrganizerTourOwnerId(tourId: string): string | undefined {
  const listing = findOrganizerTourListing(tourId);
  return listing ? resolveOwnerUserId(listing) : undefined;
}

export function isOrganizerTourOwner(tourId: string, userId: string): boolean {
  return getOrganizerTourOwnerId(tourId) === userId;
}

export function getAllOrganizerListingsIncludingDeleted(): OrganizerTourListing[] {
  const overrides = readListingsMap();
  const seedIds = new Set(ORGANIZER_TOUR_LISTINGS.map((item) => item.id));

  const seeded = ORGANIZER_TOUR_LISTINGS.map((seed) => mergeSeedListing(seed));
  const custom = Object.values(overrides).filter((item) => !seedIds.has(item.id));

  return [...seeded, ...custom];
}

export function getAllOrganizerListings(): OrganizerTourListing[] {
  return getAllOrganizerListingsIncludingDeleted().filter((item) => !item.deleted);
}

export function findOrganizerTourListing(tourId: string): OrganizerTourListing | null {
  return getAllOrganizerListingsIncludingDeleted().find((item) => item.id === tourId) ?? null;
}

function saveOrganizerListing(listing: OrganizerTourListing) {
  const map = readListingsMap();
  map[listing.id] = listing;
  writeListingsMap(map);
}

function blocksToText(
  blocks: { type: string; content: string; items?: string[] }[] | undefined
): string {
  if (!blocks?.length) return "";

  return blocks
    .map((block) => {
      if (block.type === "list" && block.items?.length) {
        return block.items.map((item) => `• ${item}`).join("\n");
      }
      return block.content;
    })
    .filter(Boolean)
    .join("\n\n");
}

function resolvePriceOnRequestSeed(slug: string) {
  const seed = getPriceOnRequestSeedForSlug(slug);
  if (!seed) {
    return { priceOnRequest: false, priceFromPrefix: false, referencePriceUsd: undefined as number | undefined };
  }
  return {
    priceOnRequest: seed.priceOnRequest,
    priceFromPrefix: seed.priceFromPrefix,
    referencePriceUsd: seed.referencePriceUsd,
  };
}

function buildSeedDraft(listing: OrganizerTourListing): OrganizerTourDraft {
  const catalogSlug = getCatalogSlug(listing);
  const marketplace = marketplaceTours.find((tour) => tour.slug === catalogSlug);
  const detail = getTourDetail(catalogSlug);

  const description = detail
    ? blocksToText(detail.descriptionBlocks)
    : marketplace?.shortDescription ?? "";

  const activityType = marketplace?.activityType ?? "Авторские туры";
  const geography = buildGeographySeed({
    slug: catalogSlug,
    country: detail?.country ?? "Аргентина",
    destination: marketplace?.destination ?? detail?.region ?? "",
    region: marketplace?.region ?? detail?.region ?? "",
    startLocation: detail?.startLocation ?? "",
  });

  const durationDays =
    detail?.durationDays ?? marketplace?.durationDays ?? listing.durationDays;
  const durationNights =
    detail?.durationNights ??
    marketplace?.durationNights ??
    Math.max(durationDays - 1, 0);
  const accommodationType =
    marketplace?.accommodationType ?? detail?.accommodationType ?? "Отель";
  const hasAccommodation = tourHasAccommodation({
    accommodationType,
    durationNights,
    accommodations: detail?.accommodations ?? [],
  });
  const defaultComfortLevel = hasAccommodation
    ? marketplace?.comfortLevel ?? detail?.comfort ?? "Комфорт"
    : NO_ACCOMMODATION_LABEL;
  const bookingMode = detail?.bookingMode ?? marketplace?.bookingMode ?? "both";
  const priceOnRequestSeed = resolvePriceOnRequestSeed(catalogSlug);
  const privateSeed = getPrivateTourSeedForSlug(catalogSlug);
  const waitlistSeed = getWaitlistSeedForSlug(catalogSlug);
  const logisticsSeed = mergeLogisticsSeed(catalogSlug, {
    arrivalDepartureEnabled: false,
    arrivalDepartureCities: [],
  });
  const hasArrivalDetails = Boolean(
    detail?.arrival &&
      (detail.arrival.airports.length > 0 ||
        detail.arrival.flights.length > 0 ||
        detail.arrival.transfers.length > 0 ||
        detail.arrival.meetingPoint.trim())
  );

  const draft: OrganizerTourDraft = {
    ...listing,
    shortDescription: detail?.shortDescription ?? marketplace?.shortDescription ?? "",
    description,
    destination: geography.mainLocation || (marketplace?.destination ?? detail?.region ?? ""),
    region: geography.touristRegions[0] ?? marketplace?.region ?? detail?.region ?? "",
    country: geography.countries[0] ?? detail?.country ?? "Аргентина",
    startLocation: geography.mapStartPoint || (detail?.startLocation ?? ""),
    ...geography,
    durationDays,
    durationNights,
    priceUsd: priceOnRequestSeed.priceOnRequest
      ? (priceOnRequestSeed.referencePriceUsd ?? 0)
      : (detail?.priceUsd ?? marketplace?.priceUsd ?? 0),
    originalPriceUsd: detail?.originalPriceUsd ?? marketplace?.originalPriceUsd ?? null,
    priceCurrency: "USD",
    priceFromPrefix: priceOnRequestSeed.priceFromPrefix ?? false,
    priceOnRequest: priceOnRequestSeed.priceOnRequest ?? false,
    enabledDiscounts: [],
    groupDiscount: normalizeGroupDiscountSettings(
      getGroupDiscountSeedForSlug(listing.slug ?? listing.catalogSlug ?? "")
    ),
    isPrivate: privateSeed?.isPrivate ?? false,
    privateAccessToken: privateSeed?.privateAccessToken,
    waitlistEnabled: waitlistSeed?.waitlistEnabled ?? false,
    individualTourEnabled: bookingMode === "on_request" || bookingMode === "both",
    individualPeriodFrom:
      isoToDayMonth(detail?.requestDateFrom ?? marketplace?.requestDateFrom) || "01.01",
    individualPeriodTo:
      isoToDayMonth(detail?.requestDateTo ?? marketplace?.requestDateTo) || "31.12",
    individualPriceUsd: detail?.priceUsd ?? marketplace?.priceUsd ?? 0,
    autoRollGroupDatesToNextYear: false,
    groupTourDates: mergeGroupDatesSeed(
      catalogSlug,
      detail?.dates?.length ? detail.dates.map(mapTourDatePriceToGroupDate) : [],
      detail?.priceUsd ?? marketplace?.priceUsd ?? 0
    ),
    activityType,
    tourActivities: [activityType],
    collections: [],
    difficultyLevel: marketplace?.difficultyLevel ?? detail?.difficulty ?? "Умеренная",
    difficultyDescriptionText: "",
    comfortLevel: defaultComfortLevel,
    comfortLevels: [defaultComfortLevel],
    accommodationType,
    accommodationDescriptionText:
      getAccommodationSeedForSlug(catalogSlug)?.description ?? "",
    accommodationPhotos: [],
    accommodationPlaces: mergeAccommodationSeedPlaces(
      catalogSlug,
      detail?.accommodations?.length
        ? detail.accommodations.map(mapTourAccommodationToPlace)
        : []
    ).map((place) => normalizeAccommodationPlace(place)),
    accommodationUpgradesEnabled:
      getAccommodationSeedForSlug(catalogSlug)?.upgradesEnabled ?? true,
    groupMin: detail?.groupMin ?? marketplace?.groupSizeMin ?? 4,
    groupMax: detail?.groupMax ?? marketplace?.groupSizeMax ?? 12,
    minimumAge: detail?.minimumAge ?? marketplace?.minimumAge ?? 0,
    maximumAge: null,
    maxWeightEnabled: false,
    maxWeightKg: null,
    languages: (marketplace?.language ??
      detail?.organizer?.languages ?? ["Русский"]) as TourLanguage[],
    includedText: (detail?.included ?? []).join("\n"),
    excludedText: (detail?.excluded ?? []).join("\n"),
    bookingMode,
    gallery: detail?.gallery?.length
      ? detail.gallery
      : marketplace?.gallery ?? [listing.image],
    places: detail?.places?.length ? detail.places : [],
    guides: createDefaultTourGuides(),
    routeMapImage: "",
    routePoints: detail?.routePoints?.length
      ? detail.routePoints.map((point) => ({ ...point }))
      : getTourRoutePoints(catalogSlug),
    programDays: detail?.itinerary?.length
      ? detail.itinerary.map(mapItineraryToProgramDay)
      : [createEmptyProgramDay(1)],
    importantInfo: detail?.importantInfo?.length ? [...detail.importantInfo] : [],
    faq: detail?.faq?.length ? detail.faq.map((item) => ({ ...item })) : [],
    packingListEnabled: false,
    packingListText: "",
    insuranceType: "recommended",
    insuranceDescription: "",
    useCancellationTemplate: true,
    customCancellationText: "",
    ticketRecommendationsEnabled: detail?.arrival.flights.length ? true : false,
    ticketRecommendationsText: detail?.arrival.flights.join("\n") ?? "",
    arrivalDepartureEnabled: logisticsSeed.arrivalDepartureEnabled,
    arrivalDepartureCities: logisticsSeed.arrivalDepartureCities,
    arrivalDetailsEnabled: hasArrivalDetails,
    arrivalAirportsText: detail?.arrival.airports.join("\n") ?? "",
    arrivalTransfersText: detail?.arrival.transfers.join("\n") ?? "",
    arrivalMeetingPoint: detail?.arrival.meetingPoint ?? "",
    checkoutPaymentOptions: { ...DEFAULT_TOUR_CHECKOUT_PAYMENT_OPTIONS },
    customBookingLink: normalizeCustomBookingLink(
      getCustomBookingSeedForSlug(catalogSlug)?.customBookingLink ??
        createDefaultCustomBookingLink()
    ),
    participantRecommendations: detail?.organizerComment?.recommendations?.length
      ? [...detail.organizerComment.recommendations]
      : [],
    routeFeaturesText: detail?.organizerComment?.routeNotes ?? "",
    itineraryOrganizerCommentText: detail?.itineraryOrganizerComment ?? "",
    accommodationOrganizerCommentText: detail?.accommodationOrganizerComment ?? "",
    sectionOrganizerComments: mergeSectionOrganizerComments(detail?.sectionOrganizerComments, {
      itinerary: detail?.itineraryOrganizerComment,
      accommodations: detail?.accommodationOrganizerComment,
    }),
    travelRisks: normalizeTravelRisks(detail?.travelRisks),
    updatedAt: listing.updatedAt,
  };

  return applyOrganizerSeedOverrides(listing.id, draft);
}

function buildEmptyDraft(listing: OrganizerTourListing): OrganizerTourDraft {
  const geography = buildGeographySeed({
    slug: getCatalogSlug(listing),
    country: "Аргентина",
    destination: "",
    region: "",
    startLocation: "",
  });

  return {
    ...listing,
    shortDescription: "",
    description: "",
    destination: "",
    region: "",
    country: "Аргентина",
    startLocation: "",
    ...geography,
    durationNights: Math.max(listing.durationDays - 1, 0),
    priceUsd: 0,
    originalPriceUsd: null,
    priceCurrency: "USD",
    priceFromPrefix: false,
    priceOnRequest: false,
    enabledDiscounts: [],
    groupDiscount: normalizeGroupDiscountSettings(null),
    isPrivate: false,
    privateAccessToken: undefined,
    waitlistEnabled: false,
    individualTourEnabled: false,
    individualPeriodFrom: "01.01",
    individualPeriodTo: "31.12",
    individualPriceUsd: 0,
    autoRollGroupDatesToNextYear: false,
    groupTourDates: [],
    activityType: "Авторские туры",
    tourActivities: ["Авторские туры"],
    collections: [],
    difficultyLevel: "Умеренная",
    difficultyDescriptionText: "",
    comfortLevel: "Комфорт",
    comfortLevels: ["Комфорт"],
    accommodationType: "Отель",
    accommodationDescriptionText: "",
    accommodationPhotos: [],
    accommodationPlaces: [],
    accommodationUpgradesEnabled: true,
    groupMin: 1,
    groupMax: 12,
    minimumAge: 0,
    maximumAge: null,
    maxWeightEnabled: false,
    maxWeightKg: null,
    languages: ["Русский"],
    includedText: "",
    excludedText: "",
    bookingMode: "both",
    gallery: [listing.image],
    places: [],
    guides: createDefaultTourGuides(),
    routeMapImage: "",
    routePoints: [],
    programDays: [createEmptyProgramDay(1)],
    importantInfo: [],
    faq: [],
    packingListEnabled: false,
    packingListText: "",
    insuranceType: "recommended",
    insuranceDescription: "",
    useCancellationTemplate: true,
    customCancellationText: "",
    ticketRecommendationsEnabled: false,
    ticketRecommendationsText: "",
    arrivalDepartureEnabled: false,
    arrivalDepartureCities: [],
    arrivalDetailsEnabled: false,
    arrivalAirportsText: "",
    arrivalTransfersText: "",
    arrivalMeetingPoint: "",
    checkoutPaymentOptions: { ...DEFAULT_TOUR_CHECKOUT_PAYMENT_OPTIONS },
    customBookingLink: createDefaultCustomBookingLink(),
    participantRecommendations: [],
    routeFeaturesText: "",
    itineraryOrganizerCommentText: "",
    accommodationOrganizerCommentText: "",
    sectionOrganizerComments: {},
    travelRisks: [],
    updatedAt: new Date().toISOString(),
  };
}

function draftToListing(draft: OrganizerTourDraft): OrganizerTourListing {
  return {
    id: draft.id,
    ownerUserId: resolveOwnerUserId(draft),
    slug: draft.slug,
    catalogSlug: draft.catalogSlug,
    title: draft.title,
    image: draft.image,
    coverLabel: draft.coverLabel,
    durationDays: draft.durationDays,
    type: draft.type,
    status: draft.status,
    archived: draft.archived,
    deleted: draft.deleted,
    isPreliminaryProgram: draft.isPreliminaryProgram,
    partnerName: draft.partnerName,
    partnerUrl: draft.partnerUrl,
    updatedAt: draft.updatedAt,
  };
}

export function getOrganizerTourListings(): OrganizerTourListing[] {
  const drafts = readDraftMap();

  return getAllOrganizerListings().map((listing) => {
    const draft = drafts[listing.id] ?? buildSeedDraft(listing);
    return draftToListing(draft);
  });
}

export function getOrganizerTourListingsForUser(userId: string): OrganizerTourListing[] {
  return getOrganizerTourListings().filter(
    (listing) => resolveOwnerUserId(listing) === userId
  );
}

function normalizeDraft(draft: OrganizerTourDraft, listing: OrganizerTourListing): OrganizerTourDraft {
  const seed = ORGANIZER_TOUR_LISTINGS.some((item) => item.id === listing.id)
    ? buildSeedDraft(listing)
    : buildEmptyDraft(listing);

  return {
    ...seed,
    ...draft,
    tourActivities:
      draft.tourActivities?.length ? draft.tourActivities : seed.tourActivities,
    collections: draft.collections ?? seed.collections,
    difficultyDescriptionText:
      draft.difficultyDescriptionText?.trim()
        ? draft.difficultyDescriptionText
        : seed.difficultyDescriptionText,
    countries: draft.countries?.length ? draft.countries : seed.countries,
    cities: draft.cities ?? seed.cities,
    mainLocation: draft.mainLocation?.trim() ? draft.mainLocation : seed.mainLocation,
    touristRegions: draft.touristRegions ?? seed.touristRegions,
    landmarks: draft.landmarks ?? seed.landmarks,
    mapStartPoint: draft.mapStartPoint?.trim() ? draft.mapStartPoint : seed.mapStartPoint,
    places: normalizeImpressions(draft.places?.length ? draft.places : seed.places),
    guides: draft.guides?.length ? draft.guides : seed.guides,
    comfortLevels: draft.comfortLevels?.length
      ? draft.comfortLevels
      : draft.comfortLevel
        ? [draft.comfortLevel]
        : seed.comfortLevels,
    accommodationDescriptionText:
      draft.accommodationDescriptionText?.trim()
        ? draft.accommodationDescriptionText
        : seed.accommodationDescriptionText,
    accommodationPhotos: draft.accommodationPhotos ?? seed.accommodationPhotos,
    accommodationPlaces: resolveAccommodationPlaces(draft, seed).map((place) =>
      normalizeAccommodationPlace(place)
    ),
    accommodationUpgradesEnabled:
      draft.accommodationUpgradesEnabled ?? seed.accommodationUpgradesEnabled ?? true,
    priceCurrency: draft.priceCurrency ?? seed.priceCurrency,
    priceFromPrefix: draft.priceFromPrefix ?? seed.priceFromPrefix,
    priceOnRequest: draft.priceOnRequest ?? seed.priceOnRequest,
    enabledDiscounts: draft.enabledDiscounts ?? seed.enabledDiscounts,
    groupDiscount: normalizeGroupDiscountSettings(draft.groupDiscount ?? seed.groupDiscount),
    isPrivate: draft.isPrivate ?? seed.isPrivate ?? false,
    privateAccessToken:
      (draft.isPrivate ?? seed.isPrivate)
        ? draft.privateAccessToken ?? seed.privateAccessToken
        : undefined,
    waitlistEnabled: draft.waitlistEnabled ?? seed.waitlistEnabled ?? false,
    individualTourEnabled: draft.individualTourEnabled ?? seed.individualTourEnabled,
    individualPeriodFrom: draft.individualPeriodFrom?.trim()
      ? draft.individualPeriodFrom
      : seed.individualPeriodFrom,
    individualPeriodTo: draft.individualPeriodTo?.trim()
      ? draft.individualPeriodTo
      : seed.individualPeriodTo,
    individualPriceUsd:
      draft.individualPriceUsd != null ? draft.individualPriceUsd : seed.individualPriceUsd,
    autoRollGroupDatesToNextYear:
      draft.autoRollGroupDatesToNextYear ?? seed.autoRollGroupDatesToNextYear,
    groupTourDates: draft.groupTourDates?.length
      ? draft.groupTourDates.map((item) => normalizeGroupTourDate(item))
      : seed.groupTourDates,
    routeMapImage: draft.routeMapImage ?? seed.routeMapImage,
    routePoints: normalizeRoutePoints(draft.routePoints, seed.routePoints),
    programDays: normalizeProgramDays(draft.programDays, seed.programDays),
    importantInfo: draft.importantInfo?.length
      ? normalizeTermsItems(draft.importantInfo)
      : seed.importantInfo,
    faq: draft.faq?.length ? normalizeFaqItems(draft.faq) : seed.faq,
    packingListEnabled: draft.packingListEnabled ?? seed.packingListEnabled,
    packingListText: draft.packingListText?.trim()
      ? draft.packingListText
      : seed.packingListText,
    insuranceType: draft.insuranceType ?? seed.insuranceType,
    insuranceDescription: draft.insuranceDescription?.trim()
      ? draft.insuranceDescription
      : seed.insuranceDescription,
    useCancellationTemplate: draft.useCancellationTemplate ?? seed.useCancellationTemplate,
    customCancellationText: draft.customCancellationText?.trim()
      ? draft.customCancellationText
      : seed.customCancellationText,
    includedText: draft.includedText?.trim() ? draft.includedText : seed.includedText,
    excludedText: draft.excludedText?.trim() ? draft.excludedText : seed.excludedText,
    ticketRecommendationsEnabled:
      draft.ticketRecommendationsEnabled ?? seed.ticketRecommendationsEnabled,
    ticketRecommendationsText: draft.ticketRecommendationsText?.trim()
      ? draft.ticketRecommendationsText
      : seed.ticketRecommendationsText,
    arrivalDepartureEnabled: draft.arrivalDepartureEnabled ?? seed.arrivalDepartureEnabled,
    arrivalDepartureCities: normalizeArrivalDepartureCities(
      draft.arrivalDepartureCities?.length
        ? draft.arrivalDepartureCities
        : seed.arrivalDepartureCities
    ),
    arrivalDetailsEnabled: draft.arrivalDetailsEnabled ?? seed.arrivalDetailsEnabled,
    arrivalAirportsText: draft.arrivalAirportsText?.trim()
      ? draft.arrivalAirportsText
      : seed.arrivalAirportsText,
    arrivalTransfersText: draft.arrivalTransfersText?.trim()
      ? draft.arrivalTransfersText
      : seed.arrivalTransfersText,
    arrivalMeetingPoint: draft.arrivalMeetingPoint?.trim()
      ? draft.arrivalMeetingPoint
      : seed.arrivalMeetingPoint,
    checkoutPaymentOptions: normalizeTourCheckoutPaymentOptions(
      draft.checkoutPaymentOptions ?? seed.checkoutPaymentOptions
    ),
    customBookingLink: normalizeCustomBookingLink(
      draft.customBookingLink ?? seed.customBookingLink
    ),
    participantRecommendations: normalizeParticipantRecommendations(
      draft.participantRecommendations?.length
        ? draft.participantRecommendations
        : seed.participantRecommendations
    ),
    routeFeaturesText: normalizeRouteFeaturesText(
      draft.routeFeaturesText?.trim() ? draft.routeFeaturesText : seed.routeFeaturesText
    ),
    itineraryOrganizerCommentText: normalizeItineraryOrganizerComment(
      draft.itineraryOrganizerCommentText?.trim()
        ? draft.itineraryOrganizerCommentText
        : seed.itineraryOrganizerCommentText
    ),
    accommodationOrganizerCommentText: normalizeAccommodationOrganizerComment(
      draft.accommodationOrganizerCommentText?.trim()
        ? draft.accommodationOrganizerCommentText
        : seed.accommodationOrganizerCommentText
    ),
    sectionOrganizerComments: normalizeSectionOrganizerComments(
      mergeSectionOrganizerComments(
        draft.sectionOrganizerComments,
        seed.sectionOrganizerComments,
        {
          itinerary:
            draft.itineraryOrganizerCommentText?.trim() || seed.itineraryOrganizerCommentText,
          accommodations:
            draft.accommodationOrganizerCommentText?.trim() ||
            seed.accommodationOrganizerCommentText,
        }
      )
    ),
    travelRisks: normalizeTravelRisks(
      draft.travelRisks?.length ? draft.travelRisks : seed.travelRisks
    ),
    maxWeightEnabled:
      draft.maxWeightEnabled ??
      ((draft.maxWeightKg ?? 0) > 0 ? true : seed.maxWeightEnabled),
    maxWeightKg: draft.maxWeightKg ?? seed.maxWeightKg,
  };
}

function resolveAccommodationPlaces(
  draft: OrganizerTourDraft & { accommodations?: import("@/types").TourAccommodation[] },
  seed: OrganizerTourDraft
) {
  if (draft.accommodationPlaces?.length) return draft.accommodationPlaces;
  if (draft.accommodations?.length) {
    return draft.accommodations.map(mapTourAccommodationToPlace);
  }
  return seed.accommodationPlaces;
}

export function readOrganizerTourDraft(
  tourId: string,
  actor: SessionUser | null = null
): OrganizerTourDraft | null {
  const listing = findOrganizerTourListing(tourId);
  if (!listing || listing.deleted) return null;

  if (actor) {
    const allowed = assertPermission(canEditTour(actor, resolveOwnerUserId(listing)));
    if ("error" in allowed) return null;
  }

  const drafts = readDraftMap();
  const draft = drafts[tourId] ?? (
    ORGANIZER_TOUR_LISTINGS.some((item) => item.id === listing.id)
      ? buildSeedDraft(listing)
      : buildEmptyDraft(listing)
  );
  return normalizeDraft(draft, listing);
}

export function saveOrganizerTourDraft(
  draft: OrganizerTourDraft,
  actor: SessionUser | null,
  options?: { skipRemoteSync?: boolean }
): { draft: OrganizerTourDraft } | { error: string } {
  const allowed = assertPermission(canEditTour(actor, resolveOwnerUserId(draft)));
  if ("error" in allowed) return { error: allowed.error };

  if (!draft.id.trim()) {
    return { error: "Не удалось сохранить тур" };
  }

  if (!draft.title.trim()) {
    return { error: "Укажите название тура" };
  }

  if (draft.status === "published" && !draft.archived) {
    const readiness = evaluatePublishReadiness(draft);
    if (!readiness.ready && readiness.blockingMessage) {
      return { error: readiness.blockingMessage };
    }
  }

  const next: OrganizerTourDraft = {
    ...draft,
    title: draft.title.trim().slice(0, ORGANIZER_TOUR_TITLE_MAX),
    shortDescription: draft.shortDescription.trim().slice(0, ORGANIZER_TOUR_GENERAL_DESCRIPTION_MAX),
    comfortLevels: draft.comfortLevels?.length ? draft.comfortLevels : [draft.comfortLevel],
    comfortLevel: primaryComfortLevel(
      draft.comfortLevels?.length ? draft.comfortLevels : [draft.comfortLevel]
    ),
    accommodationDescriptionText: draft.accommodationDescriptionText
      .trim()
      .slice(0, ORGANIZER_TOUR_ACCOMMODATION_DESCRIPTION_MAX),
    accommodationPhotos: draft.accommodationPhotos.filter(Boolean),
    accommodationPlaces: draft.accommodationPlaces.map((item) =>
      normalizeAccommodationPlace({
        ...item,
        nights: Math.max(1, item.nights),
        name: item.name.trim(),
        description: item.description.trim(),
        images: item.images.filter(Boolean),
        amenities: item.amenities.map((amenity) => amenity.trim()).filter(Boolean),
        roomTypes: item.roomTypes.map((room) => ({
          ...room,
          name: room.name.trim(),
          description: room.description.trim(),
          capacity: Math.max(1, room.capacity),
          priceUsdPerPerson: Math.max(0, room.priceUsdPerPerson),
          images: room.images.filter(Boolean),
        })),
        alternatives: item.alternatives.map((alternative) => ({
          ...alternative,
          name: alternative.name.trim(),
          description: alternative.description.trim(),
          images: alternative.images.filter(Boolean),
          bookingUrl: alternative.bookingUrl?.trim() || undefined,
          bookingLabel: alternative.bookingLabel?.trim() || undefined,
        })),
        bookingUrl: item.bookingUrl?.trim() || undefined,
        bookingLabel: item.bookingLabel?.trim() || undefined,
      })
    ),
    accommodationUpgradesEnabled: draft.accommodationUpgradesEnabled,
    individualPriceUsd: Math.max(0, draft.individualPriceUsd),
    groupTourDates: draft.groupTourDates.map((item) => {
      const normalized = normalizeGroupTourDate(item);
      return {
        ...normalized,
        startDate: normalized.startDate.trim(),
        endDate: normalized.endDate.trim(),
        priceUsd: Math.max(0, normalized.priceUsd),
        totalSeats: Math.max(0, normalized.totalSeats),
        spotsLeft: Math.max(0, normalized.spotsLeft),
        fullPaymentDaysBefore: Math.max(0, normalized.fullPaymentDaysBefore),
        prepaymentAmount: Math.max(0, normalized.prepaymentAmount),
      };
    }),
    routeMapImage: draft.routeMapImage.trim(),
    routePoints: normalizeRoutePoints(draft.routePoints),
    programDays: renumberProgramDays(
      (draft.programDays?.length ? draft.programDays : [createEmptyProgramDay(1)]).map((day, index) =>
        normalizeProgramDay(day, index + 1)
      )
    ),
    includedText: listItemsToText(normalizeTermsItems(textToListItems(draft.includedText))),
    excludedText: listItemsToText(normalizeTermsItems(textToListItems(draft.excludedText))),
    importantInfo: normalizeTermsItems(draft.importantInfo),
    faq: normalizeFaqItems(draft.faq).filter((item) => item.question && item.answer),
    places: normalizeImpressions(draft.places),
    packingListText: draft.packingListText.trim().slice(0, ORGANIZER_TOUR_PACKING_LIST_MAX),
    insuranceDescription: draft.insuranceDescription
      .trim()
      .slice(0, ORGANIZER_TOUR_INSURANCE_DESCRIPTION_MAX),
    customCancellationText: draft.customCancellationText
      .trim()
      .slice(0, ORGANIZER_TOUR_CANCELLATION_TEXT_MAX),
    country: draft.countries[0] ?? draft.country,
    destination: draft.mainLocation || draft.destination,
    region: draft.touristRegions[0] ?? draft.region,
    startLocation: draft.mapStartPoint || draft.startLocation,
    customBookingLink: normalizeCustomBookingLink(draft.customBookingLink),
    travelRisks: normalizeTravelRisks(draft.travelRisks),
    updatedAt: new Date().toISOString(),
  };

  const drafts = readDraftMap();
  drafts[next.id] = next;
  writeDraftMap(drafts);

  saveOrganizerListing(draftToListing(next));
  const canonical = upsertTourFromOrganizerDraft(next);
  if (!options?.skipRemoteSync) {
    fireOrganizerTourSync(canonical);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ORGANIZER_TOURS_UPDATED_EVENT));
  }

  return { draft: next };
}

export function createOrganizerTour(
  actor: SessionUser | null
): { draft: OrganizerTourDraft } | { error: string } {
  const allowed = assertPermission(canCreateTour(actor));
  if ("error" in allowed) return { error: allowed.error };

  if (typeof window === "undefined") {
    return { error: "Создание тура доступно в браузере" };
  }

  const takenSlugs = collectTakenCatalogSlugs(
    getAllOrganizerListingsIncludingDeleted(),
    marketplaceTours.map((tour) => tour.slug)
  );
  const slug = generateUniqueTourSlug("novyi-tur", takenSlugs);
  const id = createOrganizerTourId();

  const listing: OrganizerTourListing = {
    id,
    ownerUserId: actor!.id,
    slug,
    catalogSlug: slug,
    title: "Новый тур",
    image: DEFAULT_TOUR_IMAGE,
    durationDays: 1,
    type: "tour",
    status: "draft",
    archived: false,
    partnerName: "Пора в Аргентину",
    partnerUrl: "/tours",
    updatedAt: new Date().toISOString(),
  };

  const draft = buildEmptyDraft(listing);
  saveOrganizerListing(listing);

  const drafts = readDraftMap();
  drafts[id] = draft;
  writeDraftMap(drafts);

  const canonical = upsertTourFromOrganizerDraft(draft);
  fireOrganizerTourSync(canonical);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ORGANIZER_TOURS_UPDATED_EVENT));
  }

  return { draft };
}

export function cloneOrganizerTour(
  sourceTourId: string,
  actor: SessionUser | null
): { draft: OrganizerTourDraft } | { error: string } {
  if (typeof window === "undefined") {
    return { error: "Клонирование доступно в браузере" };
  }

  const source = readOrganizerTourDraft(sourceTourId, actor);
  if (!source) return { error: "Исходный тур не найден" };

  const allowed = assertPermission(canEditTour(actor, resolveOwnerUserId(source)));
  if ("error" in allowed) return { error: allowed.error };

  const takenSlugs = collectTakenCatalogSlugs(
    getAllOrganizerListingsIncludingDeleted(),
    marketplaceTours.map((tour) => tour.slug)
  );
  const slug = generateUniqueTourSlug(`${source.title} kopiya`, takenSlugs);
  const id = createOrganizerTourId();

  const listing: OrganizerTourListing = {
    id,
    ownerUserId: actor!.id,
    slug,
    catalogSlug: slug,
    title: `${source.title} (копия)`.slice(0, ORGANIZER_TOUR_TITLE_MAX),
    image: source.image,
    coverLabel: source.coverLabel,
    durationDays: source.durationDays,
    type: source.type,
    status: "draft",
    archived: false,
    isPreliminaryProgram: source.isPreliminaryProgram,
    partnerName: source.partnerName,
    partnerUrl: source.partnerUrl,
    updatedAt: new Date().toISOString(),
  };

  const clone: OrganizerTourDraft = normalizeDraft(
    {
      ...source,
      ...listing,
      id,
      slug,
      catalogSlug: slug,
      status: "draft",
      archived: false,
      deleted: false,
      faq: source.faq.map((item) => ({ ...item, id: `${item.id}-copy-${Date.now()}` })),
      programDays: source.programDays.map((day) => ({
        ...day,
        id: `${day.id}-copy-${Date.now()}`,
      })),
      groupTourDates: source.groupTourDates.map((date) => ({
        ...date,
        id: `${date.id}-copy-${Date.now()}`,
      })),
      places: source.places.map((place) => ({
        ...place,
        id: `${place.id}-copy-${Date.now()}`,
      })),
      routePoints: source.routePoints.map((point) => ({
        ...point,
        id: `${point.id}-copy-${Date.now()}`,
      })),
      guides: source.guides.map((guide) => ({
        ...guide,
        id: `${guide.id}-copy-${Date.now()}`,
      })),
      privateAccessToken: source.isPrivate ? generatePrivateAccessToken() : undefined,
    },
    listing
  );

  saveOrganizerListing(listing);

  const drafts = readDraftMap();
  drafts[id] = clone;
  writeDraftMap(drafts);

  const canonical = upsertTourFromOrganizerDraft(clone);
  fireOrganizerTourSync(canonical);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ORGANIZER_TOURS_UPDATED_EVENT));
  }

  return { draft: clone };
}

export function deleteOrganizerTour(
  tourId: string,
  actor: SessionUser | null
): { ok: true } | { error: string } {
  if (typeof window === "undefined") {
    return { error: "Удаление доступно в браузере" };
  }

  const listing = findOrganizerTourListing(tourId);
  if (!listing) return { error: "Тур не найден" };

  const allowed = assertPermission(canDeleteTour(actor, resolveOwnerUserId(listing)));
  if ("error" in allowed) return { error: allowed.error };

  const catalogSlug = getCatalogSlug(listing);
  markTourDeletedBySlug(catalogSlug);

  saveOrganizerListing({
    ...listing,
    deleted: true,
    updatedAt: new Date().toISOString(),
  });

  const drafts = readDraftMap();
  if (drafts[tourId]) {
    drafts[tourId] = { ...drafts[tourId], deleted: true };
    writeDraftMap(drafts);
    const canonical = upsertTourFromOrganizerDraft(drafts[tourId]);
    fireOrganizerTourSync(canonical);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ORGANIZER_TOURS_UPDATED_EVENT));
  }

  return { ok: true };
}

export function notifyOrganizerToursUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ORGANIZER_TOURS_UPDATED_EVENT));
  }
}
