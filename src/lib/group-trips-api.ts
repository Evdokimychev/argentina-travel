import type {
  CreateGroupTripListingInput,
  GroupTripListingView,
  OrganizerGroupTripPatchAction,
} from "@/types/group-trips";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";

export function isRemoteGroupTripsMode(): boolean {
  return isSupabaseToursEnabled();
}

export async function apiFetchGroupTrips(params?: {
  tourId?: string;
  slotDate?: string;
  mine?: boolean;
  organizer?: boolean;
}): Promise<GroupTripListingView[]> {
  const search = new URLSearchParams();
  if (params?.tourId) search.set("tourId", params.tourId);
  if (params?.slotDate) search.set("slotDate", params.slotDate);
  if (params?.mine) search.set("mine", "1");
  if (params?.organizer) search.set("organizer", "1");

  const qs = search.toString();
  const res = await fetch(`/api/group-trips${qs ? `?${qs}` : ""}`);
  if (!res.ok) {
    throw new Error("Не удалось загрузить наборы группы");
  }
  const json = (await res.json()) as { listings?: GroupTripListingView[] };
  return json.listings ?? [];
}

export async function apiCreateGroupTripListing(
  input: CreateGroupTripListingInput
): Promise<GroupTripListingView> {
  const res = await fetch("/api/group-trips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as { listing?: GroupTripListingView; error?: string };
  if (!res.ok || !json.listing) {
    throw new Error(json.error ?? "Не удалось создать набор группы");
  }
  return json.listing;
}

export async function apiJoinGroupTrip(listingId: string): Promise<GroupTripListingView> {
  const res = await fetch(`/api/group-trips/${encodeURIComponent(listingId)}/join`, {
    method: "POST",
  });
  const json = (await res.json()) as { listing?: GroupTripListingView; error?: string };
  if (!res.ok || !json.listing) {
    throw new Error(json.error ?? "Не удалось присоединиться");
  }
  return json.listing;
}

export async function apiLeaveGroupTrip(listingId: string): Promise<GroupTripListingView> {
  const res = await fetch(`/api/group-trips/${encodeURIComponent(listingId)}/leave`, {
    method: "POST",
  });
  const json = (await res.json()) as { listing?: GroupTripListingView; error?: string };
  if (!res.ok || !json.listing) {
    throw new Error(json.error ?? "Не удалось выйти из набора");
  }
  return json.listing;
}

export async function apiPatchOrganizerGroupTrip(
  listingId: string,
  action: OrganizerGroupTripPatchAction
): Promise<GroupTripListingView> {
  const res = await fetch(`/api/organizer/group-trips/${encodeURIComponent(listingId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const json = (await res.json()) as { listing?: GroupTripListingView; error?: string };
  if (!res.ok || !json.listing) {
    throw new Error(json.error ?? "Не удалось обновить набор");
  }
  return json.listing;
}
