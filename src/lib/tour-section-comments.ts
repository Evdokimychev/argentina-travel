import { TOUR_SECTION_COMMENT_IDS } from "@/types/tour-section-comments";
import type {
  TourSectionCommentId,
  TourSectionOrganizerComments,
} from "@/types/tour-section-comments";

export const TOUR_SECTION_ORGANIZER_COMMENT_MAX = 1500;
export const TOUR_SECTION_ORGANIZER_COMMENT_PREVIEW = 160;

export function normalizeSectionOrganizerComments(
  comments: TourSectionOrganizerComments | undefined
): TourSectionOrganizerComments {
  const normalized: TourSectionOrganizerComments = {};
  for (const id of TOUR_SECTION_COMMENT_IDS) {
    const value = comments?.[id]?.trim().slice(0, TOUR_SECTION_ORGANIZER_COMMENT_MAX);
    if (value) normalized[id] = value;
  }
  return normalized;
}

export function mergeSectionOrganizerComments(
  ...sources: Array<TourSectionOrganizerComments | undefined>
): TourSectionOrganizerComments {
  const merged: TourSectionOrganizerComments = {};
  for (const source of sources) {
    if (!source) continue;
    for (const id of TOUR_SECTION_COMMENT_IDS) {
      const value = source[id]?.trim();
      if (value) merged[id] = value;
    }
  }
  return normalizeSectionOrganizerComments(merged);
}

export function resolveSectionOrganizerComment(
  comments: TourSectionOrganizerComments | undefined,
  sectionId: TourSectionCommentId,
  legacy?: string
): string | undefined {
  const value = comments?.[sectionId]?.trim() || legacy?.trim();
  return value || undefined;
}

export function getSectionOrganizerCommentPreview(comment: string): {
  preview: string;
  needsExpand: boolean;
} {
  const trimmed = comment.trim();
  if (!trimmed) return { preview: "", needsExpand: false };

  const firstParagraph = trimmed.split(/\n{2,}/)[0]?.trim() ?? trimmed;
  const hasMultipleParagraphs = trimmed.split(/\n{2,}/).filter(Boolean).length > 1;
  const isLong = firstParagraph.length > TOUR_SECTION_ORGANIZER_COMMENT_PREVIEW;

  if (!hasMultipleParagraphs && !isLong) {
    return { preview: trimmed, needsExpand: false };
  }

  const preview = isLong
    ? `${firstParagraph.slice(0, TOUR_SECTION_ORGANIZER_COMMENT_PREVIEW).trim()}…`
    : firstParagraph;

  return { preview, needsExpand: true };
}
