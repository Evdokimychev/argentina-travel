import { ORGANIZER_TOUR_LISTINGS } from "@/data/organizer-tours";
import { marketplaceTours } from "@/data/marketplace-tours";
import { getTourDetail } from "@/lib/tours";
import {
  DEFAULT_IGUAZU_GENERAL_DESCRIPTION,
  ORGANIZER_TOUR_GENERAL_DESCRIPTION_MAX,
} from "@/data/tour-description-defaults";
import { DEFAULT_IGUAZU_GALLERY } from "@/data/tour-photos-defaults";
import { DEFAULT_IGUAZU_IMPRESSIONS } from "@/data/tour-impressions-defaults";
import { createDefaultTourGuides } from "@/data/tour-guides-defaults";
import {
  ACCOMMODATION_VARIANT_NOT_FILLED,
  DEFAULT_IGUAZU_ACCOMMODATION_DESCRIPTION,
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
import type { TourCollection } from "@/data/tour-collections";
import { DEFAULT_IGUAZU_DIFFICULTY_DESCRIPTION } from "@/data/tour-levels";
import {
  DEFAULT_IGUAZU_PROGRAM_DAYS,
  createEmptyProgramDay,
  mapItineraryToProgramDay,
  normalizeProgramDay,
  normalizeProgramDays,
  renumberProgramDays,
} from "@/data/tour-program-defaults";
import {
  DEFAULT_IGUAZU_EXCLUDED,
  DEFAULT_IGUAZU_FAQ,
  DEFAULT_IGUAZU_IMPORTANT_INFO,
  DEFAULT_IGUAZU_INCLUDED,
  DEFAULT_IGUAZU_PACKING_LIST,
  ORGANIZER_TOUR_PACKING_LIST_MAX,
  listItemsToText,
  normalizeFaqItems,
  normalizeTermsItems,
  textToListItems,
} from "@/data/tour-terms-defaults";
import {
  ORGANIZER_TOUR_TITLE_MAX,
  ORGANIZER_TOURS_UPDATED_EVENT,
  type OrganizerTourDraft,
  type OrganizerTourListing,
} from "@/types/organizer-tour";
import type { ActivityType, TourLanguage } from "@/types";

const DRAFTS_KEY = "argentina-travel-organizer-tour-drafts";

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
  const marketplace = marketplaceTours.find((tour) => tour.slug === listing.slug);
  const detail = getTourDetail(listing.slug);

  const description = detail
    ? blocksToText(detail.descriptionBlocks)
    : marketplace?.shortDescription ?? "";

  const activityType = marketplace?.activityType ?? "Авторские туры";
  const iguazuActivities: ActivityType[] = ["Экскурсионные туры", "Пешие туры", "Рафтинг"];
  const geography = buildGeographySeed({
    slug: listing.slug,
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

  return {
    ...listing,
    shortDescription:
      listing.slug === "iguazu-waterfalls-day"
        ? DEFAULT_IGUAZU_GENERAL_DESCRIPTION
        : detail?.shortDescription ?? marketplace?.shortDescription ?? "",
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
    tourActivities:
      listing.slug === "iguazu-waterfalls-day" ? iguazuActivities : [activityType],
    collections: listing.slug === "iguazu-waterfalls-day" ? (["Водные туры"] as TourCollection[]) : [],
    difficultyLevel: marketplace?.difficultyLevel ?? detail?.difficulty ?? "Умеренная",
    difficultyDescriptionText:
      listing.slug === "iguazu-waterfalls-day" ? DEFAULT_IGUAZU_DIFFICULTY_DESCRIPTION : "",
    comfortLevel: defaultComfortLevel,
    comfortLevels: [defaultComfortLevel],
    accommodationType,
    accommodationDescriptionText:
      listing.slug === "iguazu-waterfalls-day" ? DEFAULT_IGUAZU_ACCOMMODATION_DESCRIPTION : "",
    accommodationPhotos: [],
    accommodationPlaces: detail?.accommodations?.length
      ? detail.accommodations.map(mapTourAccommodationToPlace)
      : [],
    groupMin: detail?.groupMin ?? marketplace?.groupSizeMin ?? 4,
    groupMax: detail?.groupMax ?? marketplace?.groupSizeMax ?? 12,
    minimumAge: detail?.minimumAge ?? marketplace?.minimumAge ?? 0,
    maximumAge: null,
    maxWeightKg: null,
    languages: (marketplace?.language ??
      detail?.organizer?.languages ?? ["Русский"]) as TourLanguage[],
    includedText:
      listing.slug === "iguazu-waterfalls-day"
        ? listItemsToText(DEFAULT_IGUAZU_INCLUDED)
        : (detail?.included ?? []).join("\n"),
    excludedText:
      listing.slug === "iguazu-waterfalls-day"
        ? listItemsToText(DEFAULT_IGUAZU_EXCLUDED)
        : (detail?.excluded ?? []).join("\n"),
    bookingMode,
    gallery:
      listing.slug === "iguazu-waterfalls-day"
        ? [...DEFAULT_IGUAZU_GALLERY]
        : detail?.gallery?.length
          ? detail.gallery
          : marketplace?.gallery ?? [listing.image],
    places:
      listing.slug === "iguazu-waterfalls-day"
        ? [...DEFAULT_IGUAZU_IMPRESSIONS]
        : detail?.places?.length
          ? detail.places
          : [],
    guides: createDefaultTourGuides(),
    routeMapImage: "",
    programDays:
      listing.slug === "iguazu-waterfalls-day"
        ? [...DEFAULT_IGUAZU_PROGRAM_DAYS]
        : detail?.itinerary?.length
          ? detail.itinerary.map(mapItineraryToProgramDay)
          : [createEmptyProgramDay(1)],
    importantInfo:
      listing.slug === "iguazu-waterfalls-day"
        ? [...DEFAULT_IGUAZU_IMPORTANT_INFO]
        : detail?.importantInfo?.length
          ? [...detail.importantInfo]
          : [],
    faq:
      listing.slug === "iguazu-waterfalls-day"
        ? [...DEFAULT_IGUAZU_FAQ]
        : detail?.faq?.length
          ? detail.faq.map((item) => ({ ...item }))
          : [],
    packingListEnabled: listing.slug === "iguazu-waterfalls-day",
    packingListText:
      listing.slug === "iguazu-waterfalls-day" ? DEFAULT_IGUAZU_PACKING_LIST : "",
    updatedAt: listing.updatedAt,
  };
}

function draftToListing(draft: OrganizerTourDraft): OrganizerTourListing {
  return {
    id: draft.id,
    slug: draft.slug,
    title: draft.title,
    image: draft.image,
    coverLabel: draft.coverLabel,
    durationDays: draft.durationDays,
    type: draft.type,
    status: draft.status,
    archived: draft.archived,
    isPreliminaryProgram: draft.isPreliminaryProgram,
    partnerName: draft.partnerName,
    partnerUrl: draft.partnerUrl,
    updatedAt: draft.updatedAt,
  };
}

export function getOrganizerTourListings(): OrganizerTourListing[] {
  const drafts = readDraftMap();

  return ORGANIZER_TOUR_LISTINGS.map((listing) => {
    const draft = drafts[listing.id] ?? buildSeedDraft(listing);
    return draftToListing(draft);
  });
}

function normalizeDraft(draft: OrganizerTourDraft, listing: OrganizerTourListing): OrganizerTourDraft {
  const seed = buildSeedDraft(listing);

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
    places: draft.places?.length ? draft.places : seed.places,
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
    includedText: draft.includedText?.trim() ? draft.includedText : seed.includedText,
    excludedText: draft.excludedText?.trim() ? draft.excludedText : seed.excludedText,
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
  const listing = ORGANIZER_TOUR_LISTINGS.find((tour) => tour.id === tourId);
  if (!listing) return null;

  const drafts = readDraftMap();
  const draft = drafts[tourId] ?? buildSeedDraft(listing);
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
    packingListText: draft.packingListText.trim().slice(0, ORGANIZER_TOUR_PACKING_LIST_MAX),
    country: draft.countries[0] ?? draft.country,
    destination: draft.mainLocation || draft.destination,
    region: draft.touristRegions[0] ?? draft.region,
    startLocation: draft.mapStartPoint || draft.startLocation,
    updatedAt: new Date().toISOString(),
  };

  const drafts = readDraftMap();
  drafts[next.id] = next;
  writeDraftMap(drafts);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ORGANIZER_TOURS_UPDATED_EVENT));
  }

  return { draft: next };
}

export function notifyOrganizerToursUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ORGANIZER_TOURS_UPDATED_EVENT));
  }
}
