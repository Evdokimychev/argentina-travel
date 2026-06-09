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
import { buildGeographySeed } from "@/data/tour-geography";
import type { TourCollection } from "@/data/tour-collections";
import { DEFAULT_IGUAZU_DIFFICULTY_DESCRIPTION } from "@/data/tour-levels";
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
    durationNights: detail?.durationNights ?? Math.max(listing.durationDays - 1, 0),
    priceUsd: detail?.priceUsd ?? marketplace?.priceUsd ?? 0,
    originalPriceUsd: detail?.originalPriceUsd ?? marketplace?.originalPriceUsd ?? null,
    activityType,
    tourActivities:
      listing.slug === "iguazu-waterfalls-day" ? iguazuActivities : [activityType],
    collections: listing.slug === "iguazu-waterfalls-day" ? (["Водные туры"] as TourCollection[]) : [],
    difficultyLevel: marketplace?.difficultyLevel ?? detail?.difficulty ?? "Умеренная",
    difficultyDescriptionText:
      listing.slug === "iguazu-waterfalls-day" ? DEFAULT_IGUAZU_DIFFICULTY_DESCRIPTION : "",
    comfortLevel: marketplace?.comfortLevel ?? detail?.comfort ?? "Комфорт",
    accommodationType: marketplace?.accommodationType ?? detail?.accommodationType ?? "Отель",
    groupMin: detail?.groupMin ?? marketplace?.groupSizeMin ?? 4,
    groupMax: detail?.groupMax ?? marketplace?.groupSizeMax ?? 12,
    minimumAge: detail?.minimumAge ?? marketplace?.minimumAge ?? 0,
    maximumAge: null,
    maxWeightKg: null,
    languages: (marketplace?.language ??
      detail?.organizer?.languages ?? ["Русский"]) as TourLanguage[],
    includedText: (detail?.included ?? []).join("\n"),
    excludedText: (detail?.excluded ?? []).join("\n"),
    bookingMode: detail?.bookingMode ?? marketplace?.bookingMode ?? "both",
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
  };
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
