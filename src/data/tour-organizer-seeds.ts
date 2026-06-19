import type { ActivityType } from "@/types";
import type { TourCollection } from "@/data/tour-collections";
import type { OrganizerTourDraft } from "@/types/organizer-tour";
import { DEFAULT_IGUAZU_ACCOMMODATION_DESCRIPTION } from "@/data/tour-accommodation-defaults";
import { DEFAULT_IGUAZU_GENERAL_DESCRIPTION } from "@/data/tour-description-defaults";
import { DEFAULT_IGUAZU_IMPRESSIONS } from "@/data/tour-impressions-defaults";
import { DEFAULT_IGUAZU_DIFFICULTY_DESCRIPTION } from "@/data/tour-levels";
import { DEFAULT_IGUAZU_GALLERY } from "@/data/tour-photos-defaults";
import {
  DEFAULT_IGUAZU_PROGRAM_DAYS,
} from "@/data/tour-program-defaults";
import {
  DEFAULT_IGUAZU_EXCLUDED,
  DEFAULT_IGUAZU_FAQ,
  DEFAULT_IGUAZU_IMPORTANT_INFO,
  DEFAULT_IGUAZU_INCLUDED,
  DEFAULT_IGUAZU_INSURANCE_DESCRIPTION,
  DEFAULT_IGUAZU_INSURANCE_TYPE,
  DEFAULT_IGUAZU_PACKING_LIST,
  listItemsToText,
} from "@/data/tour-terms-defaults";

const IGUAZU_ACTIVITIES: ActivityType[] = ["Экскурсионные туры", "Пешие туры", "Рафтинг"];
const IGUAZU_COLLECTIONS: TourCollection[] = ["Водные туры"];

/** Optional enriched defaults keyed by organizer tour id (not public slug). */
export function applyOrganizerSeedOverrides(
  organizerTourId: string,
  draft: OrganizerTourDraft
): OrganizerTourDraft {
  if (organizerTourId !== "org-iguazu") return draft;

  return {
    ...draft,
    shortDescription: draft.shortDescription.trim()
      ? draft.shortDescription
      : DEFAULT_IGUAZU_GENERAL_DESCRIPTION,
    tourActivities: draft.tourActivities.length ? draft.tourActivities : IGUAZU_ACTIVITIES,
    collections: draft.collections.length ? draft.collections : IGUAZU_COLLECTIONS,
    difficultyDescriptionText:
      draft.difficultyDescriptionText.trim() || DEFAULT_IGUAZU_DIFFICULTY_DESCRIPTION,
    accommodationDescriptionText:
      draft.accommodationDescriptionText.trim() || DEFAULT_IGUAZU_ACCOMMODATION_DESCRIPTION,
    includedText: draft.includedText.trim()
      ? draft.includedText
      : listItemsToText(DEFAULT_IGUAZU_INCLUDED),
    excludedText: draft.excludedText.trim()
      ? draft.excludedText
      : listItemsToText(DEFAULT_IGUAZU_EXCLUDED),
    gallery: draft.gallery.length ? draft.gallery : [...DEFAULT_IGUAZU_GALLERY],
    places: draft.places.length ? draft.places : [...DEFAULT_IGUAZU_IMPRESSIONS],
    programDays: draft.programDays.length ? draft.programDays : [...DEFAULT_IGUAZU_PROGRAM_DAYS],
    importantInfo: draft.importantInfo.length ? draft.importantInfo : [...DEFAULT_IGUAZU_IMPORTANT_INFO],
    faq: draft.faq.length ? draft.faq : [...DEFAULT_IGUAZU_FAQ],
    packingListEnabled: draft.packingListEnabled || true,
    packingListText: draft.packingListText.trim() || DEFAULT_IGUAZU_PACKING_LIST,
    insuranceType: draft.insuranceDescription.trim() ? draft.insuranceType : DEFAULT_IGUAZU_INSURANCE_TYPE,
    insuranceDescription:
      draft.insuranceDescription.trim() || DEFAULT_IGUAZU_INSURANCE_DESCRIPTION,
  };
}
