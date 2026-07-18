import type { OrganizerTourDraft } from "@/types/organizer-tour";
import type { Tour } from "@/types/tour";

interface DraftSnapshotResponse {
  updatedAt: string | null;
  rowVersion?: number;
  tour: Tour | null;
  draft: OrganizerTourDraft | null;
  moderationStatus?: OrganizerTourDraft["moderationStatus"];
  moderationNotes?: string | null;
}

interface DraftPatchResponse {
  ok: true;
  updatedAt: string | null;
  rowVersion?: number;
  moderationStatus?: OrganizerTourDraft["moderationStatus"];
  moderationNotes?: string | null;
}

interface DraftListResponse {
  drafts: OrganizerTourDraft[];
}

interface ApiErrorPayload {
  error?: string;
  serverUpdatedAt?: string | null;
}

export class OrganizerDraftConflictError extends Error {
  readonly serverUpdatedAt: string | null;

  constructor(serverUpdatedAt: string | null, message = "Конфликт синхронизации черновика") {
    super(message);
    this.name = "OrganizerDraftConflictError";
    this.serverUpdatedAt = serverUpdatedAt;
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & ApiErrorPayload;
  if (!response.ok) {
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return body;
}

export async function fetchOrganizerTourDraftSnapshot(
  tourId: string
): Promise<DraftSnapshotResponse> {
  return readJson<DraftSnapshotResponse>(
    await fetch(`/api/organizer/tours/${encodeURIComponent(tourId)}/draft`, {
      method: "GET",
      credentials: "same-origin",
    })
  );
}

export async function patchOrganizerTourDraftRemote(input: {
  tourId: string;
  draft: OrganizerTourDraft;
  expectedUpdatedAt?: string | null;
}): Promise<DraftPatchResponse> {
  const response = await fetch(`/api/organizer/tours/${encodeURIComponent(input.tourId)}/draft`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      draft: input.draft,
      expectedUpdatedAt: input.expectedUpdatedAt ?? null,
    }),
  });

  if (response.status === 409) {
    const body = (await response.json()) as ApiErrorPayload;
    throw new OrganizerDraftConflictError(body.serverUpdatedAt ?? null, body.error);
  }

  return readJson<DraftPatchResponse>(response);
}

export async function fetchOrganizerTourDraftsRemote(): Promise<OrganizerTourDraft[]> {
  const result = await readJson<DraftListResponse>(
    await fetch("/api/organizer/tours", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    })
  );
  return result.drafts;
}

export async function deleteOrganizerTourRemote(tourId: string): Promise<void> {
  await readJson<{ ok: true }>(
    await fetch(`/api/organizer/tours/${encodeURIComponent(tourId)}/draft`, {
      method: "DELETE",
      credentials: "same-origin",
    })
  );
}
