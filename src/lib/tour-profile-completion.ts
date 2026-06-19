import type { OrganizerTourDraft, OrganizerTourEditorTabId } from "@/types/organizer-tour";
import { evaluatePublishReadiness } from "@/lib/publish-readiness";

export interface TourProfileCompletionItem {
  id: string;
  label: string;
  done: boolean;
  weight: number;
  tabId?: OrganizerTourEditorTabId;
}

export interface TourProfileCompletionResult {
  percent: number;
  items: TourProfileCompletionItem[];
  completedCount: number;
  totalCount: number;
}

function hasSchedule(draft: OrganizerTourDraft): boolean {
  if (draft.customBookingLink?.enabled) return true;
  if (draft.bookingMode === "on_request") return true;
  if (draft.individualTourEnabled) return true;
  return draft.groupTourDates.some((date) => date.startDate.trim() && date.endDate.trim());
}

function hasPhotos(draft: OrganizerTourDraft): boolean {
  return Boolean(draft.image.trim() || draft.gallery.filter(Boolean).length > 0);
}

function hasProgram(draft: OrganizerTourDraft): boolean {
  return draft.programDays.some((day) => day.title.trim() || day.description.trim());
}

function hasPrice(draft: OrganizerTourDraft): boolean {
  if (draft.priceOnRequest) return draft.priceUsd > 0;
  return draft.priceUsd > 0;
}

export function evaluateTourProfileCompletion(
  draft: OrganizerTourDraft
): TourProfileCompletionResult {
  const items: TourProfileCompletionItem[] = [
    {
      id: "title",
      label: "Название тура",
      done: draft.title.trim().length >= 8,
      weight: 12,
      tabId: "main",
    },
    {
      id: "description",
      label: "Описание",
      done: Boolean(
        draft.shortDescription.trim() ||
          draft.description.trim() ||
          hasProgram(draft)
      ),
      weight: 12,
      tabId: "main",
    },
    {
      id: "photos",
      label: "Фотографии",
      done: hasPhotos(draft),
      weight: 14,
      tabId: "main",
    },
    {
      id: "geography",
      label: "География и регион",
      done: Boolean(
        draft.region.trim() ||
          draft.destination.trim() ||
          draft.mainLocation.trim() ||
          draft.cities.length > 0
      ),
      weight: 10,
      tabId: "main",
    },
    {
      id: "price",
      label: "Стоимость",
      done: hasPrice(draft),
      weight: 14,
      tabId: "conditions",
    },
    {
      id: "dates",
      label: "Даты или бронирование",
      done: hasSchedule(draft),
      weight: 14,
      tabId: "conditions",
    },
    {
      id: "program",
      label: "Программа по дням",
      done: hasProgram(draft),
      weight: 14,
      tabId: "program",
    },
    {
      id: "languages",
      label: "Языки тура",
      done: draft.languages.length > 0,
      weight: 5,
      tabId: "main",
    },
    {
      id: "included",
      label: "Что включено / не включено",
      done: Boolean(draft.includedText.trim() || draft.excludedText.trim()),
      weight: 5,
      tabId: "terms",
    },
    {
      id: "faq",
      label: "Частые вопросы",
      done: draft.faq.some((item) => item.question.trim() && item.answer.trim()),
      weight: 5,
      tabId: "terms",
    },
  ];

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const earnedWeight = items
    .filter((item) => item.done)
    .reduce((sum, item) => sum + item.weight, 0);
  const percent = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  return {
    percent,
    items,
    completedCount: items.filter((item) => item.done).length,
    totalCount: items.length,
  };
}

/** Процент с учётом блокирующих пунктов публикации — не ниже фактического заполнения. */
export function tourProfileCompletionPercent(draft: OrganizerTourDraft): number {
  const profile = evaluateTourProfileCompletion(draft);
  const readiness = evaluatePublishReadiness(draft);
  const blockingPenalty =
    readiness.blockingCount > 0
      ? Math.min(30, readiness.blockingCount * 8)
      : 0;
  return Math.max(0, Math.min(100, profile.percent - blockingPenalty));
}
