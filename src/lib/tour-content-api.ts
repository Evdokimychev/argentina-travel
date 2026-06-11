import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import type { Tour } from "@/types/tour";

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return body;
}

export async function apiSyncOrganizerTour(tour: Tour): Promise<void> {
  await parseJson<{ ok: true }>(
    await fetch("/api/organizer/tours/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tour }),
    })
  );
}

export async function apiFetchPublishedTourListings(): Promise<
  import("@/types").TourListing[]
> {
  const data = await parseJson<{ tours: import("@/types").TourListing[] }>(
    await fetch("/api/tours")
  );
  return data.tours;
}

export async function apiFetchPublishedTourBySlug(slug: string) {
  const response = await fetch(`/api/tours/${encodeURIComponent(slug)}`);
  if (response.status === 404) return null;
  const data = await parseJson<{ tour: import("@/types").TourDetail }>(response);
  return data.tour;
}

export function isRemoteToursMode(): boolean {
  return isSupabaseToursEnabled();
}

export function fireOrganizerTourSync(tour: Tour): void {
  if (!isRemoteToursMode()) return;
  void apiSyncOrganizerTour(tour).catch(() => undefined);
}
