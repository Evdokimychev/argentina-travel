import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import type {
  OrganizerTripPrepSummary,
  TripPrepChecklistResponse,
  TripPrepTemplateView,
} from "@/types/trip-prep";

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return body;
}

export function isRemoteTripPrepMode(): boolean {
  return isSupabaseBookingsEnabled();
}

export async function apiFetchTripPrepChecklist(
  bookingId: string
): Promise<TripPrepChecklistResponse> {
  const data = await parseJson<{ checklist: TripPrepChecklistResponse }>(
    await fetch(`/api/trip-prep?bookingId=${encodeURIComponent(bookingId)}`)
  );
  return data.checklist;
}

export async function apiToggleTripPrepProgress(input: {
  bookingId: string;
  itemId: string;
  checked: boolean;
}): Promise<TripPrepChecklistResponse> {
  const data = await parseJson<{ checklist: TripPrepChecklistResponse }>(
    await fetch("/api/trip-prep/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.checklist;
}

export async function apiFetchOrganizerTripPrepSummary(
  bookingId: string
): Promise<OrganizerTripPrepSummary> {
  const data = await parseJson<{ summary: OrganizerTripPrepSummary }>(
    await fetch(`/api/organizer/bookings/${encodeURIComponent(bookingId)}/trip-prep-summary`)
  );
  return data.summary;
}

export async function apiFetchAdminTripPrepTemplates(): Promise<TripPrepTemplateView[]> {
  const data = await parseJson<{ items: TripPrepTemplateView[] }>(
    await fetch("/api/admin/trip-prep/templates")
  );
  return data.items;
}

export async function apiUpsertAdminTripPrepTemplate(
  template: Partial<TripPrepTemplateView> & {
    name: string;
    tourType: TripPrepTemplateView["tourType"];
    items: TripPrepTemplateView["items"];
  }
): Promise<TripPrepTemplateView> {
  const data = await parseJson<{ item: TripPrepTemplateView }>(
    await fetch("/api/admin/trip-prep/templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    })
  );
  return data.item;
}

export async function apiDeleteAdminTripPrepTemplate(templateId: string): Promise<void> {
  await parseJson<{ ok: boolean }>(
    await fetch("/api/admin/trip-prep/templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: templateId }),
    })
  );
}
