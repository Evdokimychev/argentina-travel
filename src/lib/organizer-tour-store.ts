import { ORGANIZER_TOUR_LISTINGS } from "@/data/organizer-tours";
import { marketplaceTours } from "@/data/marketplace-tours";
import { applyOrganizerSeedOverrides } from "@/data/tour-organizer-seeds";
import { getTourDetail } from "@/lib/tours";
import { ORGANIZER_TOUR_GENERAL_DESCRIPTION_MAX } from "@/data/tour-description-defaults";
import { normalizeImpressions } from "@/data/tour-impressions-defaults";
import { createDefaultTourGuides } from "@/data/tour-guides-defaults";
import {
  ORGANIZER_TOUR_ACCOMMODATION_DESCRIPTION_MAX,
  mapTourAccommodationToPlace,
} from "@/data/tour-accommodation-defaults";
import { primaryComfortLevel } from "@/data/tour-levels";
import { buildGeographySeed } from "@/data/tour-geography";
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
import type { TourLanguage } from "@/types";
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

const DRAFTS_KEY = "argentina-travel-organizer-tour-drafts";
const LISTINGS_KEY = "argentina-travel-organizer-tour-listings";

const DEFAULT_TOUR_IMAGE =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80";

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
  return overrides[seed.id] ? { ...seed, ...overrides[seed.id] } : seed;
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

  const durationNights = detail?.durationNights ?? Math.max(listing.durationDays - 1, 0);
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

  const draft: OrganizerTourDraft = {
    ...listing,
    shortDescription: detail?.shortDescription ?? marketplace?.shortDescription ?? "",
    description,
    destination: geography.mainLocation || (marketplace?.destination ?? detail?.region ?? ""),
    region: geography.touristRegions[0] ?? marketplace?.region ?? detail?.region ?? "",
    country: geography.countries[0] ?? detail?.country ?? "Аргентина",
    startLocation: geography.mapStartPoint || (detail?.startLocation ?? ""),
    ...geography,
    durationNights,
    priceUsd: detail?.priceUsd ?? marketplace?.priceUsd ?? 0,
    originalPriceUsd: detail?.originalPriceUsd ?? marketplace?.originalPriceUsd ?? null,
    priceCurrency: "USD",
    priceFromPrefix: false,
    enabledDiscounts: [],
    individualTourEnabled: bookingMode === "on_request" || bookingMode === "both",
    individualPeriodFrom:
      isoToDayMonth(detail?.requestDateFrom ?? marketplace?.requestDateFrom) || "01.01",
    individualPeriodTo:
      isoToDayMonth(detail?.requestDateTo ?? marketplace?.requestDateTo) || "31.12",
    individualPriceUsd: detail?.priceUsd ?? marketplace?.priceUsd ?? 0,
    autoRollGroupDatesToNextYear: false,
    groupTourDates: detail?.dates?.length
      ? detail.dates.map(mapTourDatePriceToGroupDate)
      : [],
    activityType,
    tourActivities: [activityType],
    collections: [],
    difficultyLevel: marketplace?.difficultyLevel ?? detail?.difficulty ?? "Умеренная",
    difficultyDescriptionText: "",
    comfortLevel: defaultComfortLevel,
    comfortLevels: [defaultComfortLevel],
    accommodationType,
    accommodationDescriptionText: "",
    accommodationPhotos: [],
    accommodationPlaces: detail?.accommodations?.length
      ? detail.accommodations.map(mapTourAccommodationToPlace)
      : [],
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
    ticketRecommendationsEnabled: false,
    ticketRecommendationsText: "",
    arrivalDepartureEnabled: false,
    arrivalDepartureCities: [],
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
    enabledDiscounts: [],
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
    updatedAt: new Date().toISOString(),
  };
}

function draftToListing(draft: OrganizerTourDraft): OrganizerTourListing {
  return {
    id: draft.id,
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
    accommodationPlaces: resolveAccommodationPlaces(draft, seed),
    priceCurrency: draft.priceCurrency ?? seed.priceCurrency,
    priceFromPrefix: draft.priceFromPrefix ?? seed.priceFromPrefix,
    enabledDiscounts: draft.enabledDiscounts ?? seed.enabledDiscounts,
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

export function readOrganizerTourDraft(tourId: string): OrganizerTourDraft | null {
  const listing = findOrganizerTourListing(tourId);
  if (!listing || listing.deleted) return null;

  const drafts = readDraftMap();
  const draft = drafts[tourId] ?? (
    ORGANIZER_TOUR_LISTINGS.some((item) => item.id === listing.id)
      ? buildSeedDraft(listing)
      : buildEmptyDraft(listing)
  );
  return normalizeDraft(draft, listing);
}

export function saveOrganizerTourDraft(
  draft: OrganizerTourDraft
): { draft: OrganizerTourDraft } | { error: string } {
  if (!draft.id.trim()) {
    return { error: "Не удалось сохранить тур" };
  }

  if (!draft.title.trim()) {
    return { error: "Укажите название тура" };
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
    accommodationPlaces: draft.accommodationPlaces.map((item) => ({
      ...item,
      nights: Math.max(1, item.nights),
      name: item.name.trim(),
      description: item.description.trim(),
      images: item.images.filter(Boolean),
      alternatives: item.alternatives.map((alternative) => ({
        ...alternative,
        name: alternative.name.trim(),
        description: alternative.description.trim(),
        images: alternative.images.filter(Boolean),
      })),
    })),
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
    updatedAt: new Date().toISOString(),
  };

  const drafts = readDraftMap();
  drafts[next.id] = next;
  writeDraftMap(drafts);

  saveOrganizerListing(draftToListing(next));
  upsertTourFromOrganizerDraft(next);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ORGANIZER_TOURS_UPDATED_EVENT));
  }

  return { draft: next };
}

export function createOrganizerTour(): { draft: OrganizerTourDraft } | { error: string } {
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

  upsertTourFromOrganizerDraft(draft);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ORGANIZER_TOURS_UPDATED_EVENT));
  }

  return { draft };
}

export function cloneOrganizerTour(
  sourceTourId: string
): { draft: OrganizerTourDraft } | { error: string } {
  if (typeof window === "undefined") {
    return { error: "Клонирование доступно в браузере" };
  }

  const source = readOrganizerTourDraft(sourceTourId);
  if (!source) return { error: "Исходный тур не найден" };

  const takenSlugs = collectTakenCatalogSlugs(
    getAllOrganizerListingsIncludingDeleted(),
    marketplaceTours.map((tour) => tour.slug)
  );
  const slug = generateUniqueTourSlug(`${source.title} kopiya`, takenSlugs);
  const id = createOrganizerTourId();

  const listing: OrganizerTourListing = {
    id,
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
      guides: source.guides.map((guide) => ({
        ...guide,
        id: `${guide.id}-copy-${Date.now()}`,
      })),
    },
    listing
  );

  saveOrganizerListing(listing);

  const drafts = readDraftMap();
  drafts[id] = clone;
  writeDraftMap(drafts);

  upsertTourFromOrganizerDraft(clone);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ORGANIZER_TOURS_UPDATED_EVENT));
  }

  return { draft: clone };
}

export function deleteOrganizerTour(tourId: string): { ok: true } | { error: string } {
  if (typeof window === "undefined") {
    return { error: "Удаление доступно в браузере" };
  }

  const listing = findOrganizerTourListing(tourId);
  if (!listing) return { error: "Тур не найден" };

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
