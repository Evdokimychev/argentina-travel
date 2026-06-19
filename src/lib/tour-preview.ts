import type { OrganizerTourDraft } from "@/types/organizer-tour";

const PREVIEW_DRAFT_PREFIX = "argentina-travel-organizer-tour-preview:";

export function organizerTourPreviewDraftKey(tourId: string): string {
  return `${PREVIEW_DRAFT_PREFIX}${tourId}`;
}

export function stageOrganizerTourPreviewDraft(draft: OrganizerTourDraft): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    organizerTourPreviewDraftKey(draft.id),
    JSON.stringify(draft)
  );
}

export function readStagedOrganizerTourPreviewDraft(
  tourId: string
): OrganizerTourDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(organizerTourPreviewDraftKey(tourId));
    if (!raw) return null;
    return JSON.parse(raw) as OrganizerTourDraft;
  } catch {
    return null;
  }
}

export function clearStagedOrganizerTourPreviewDraft(tourId: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(organizerTourPreviewDraftKey(tourId));
}
