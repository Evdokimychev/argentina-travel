import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  CreateGroupTripListingInput,
  GroupTripListingStatus,
  GroupTripListingView,
  GroupTripMemberStatus,
  GroupTripMemberView,
  OrganizerGroupTripPatchAction,
} from "@/types/group-trips";
import {
  fetchTourAvailabilityByTourId,
  type TourAvailabilitySlot,
} from "@/lib/tour-availability-server";
import {
  emitGroupTripMinReachedNotifications,
} from "@/lib/notifications/notifications-server";

type DbClient = SupabaseClient<Database>;

type ListingRow = Database["public"]["Tables"]["group_trip_listings"]["Row"];
type MemberRow = Database["public"]["Tables"]["group_trip_members"]["Row"];

const ACTIVE_MEMBER_STATUSES: GroupTripMemberStatus[] = ["interested", "confirmed"];

function toIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  return normalized;
}

function clampParticipants(value: number, min = 2, max = 999): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function isActiveMemberStatus(status: string): status is GroupTripMemberStatus {
  return status === "interested" || status === "confirmed" || status === "declined";
}

async function fetchSlotForTourDate(
  admin: DbClient,
  tourId: string,
  slotDate: string
): Promise<TourAvailabilitySlot | null> {
  const slots = await fetchTourAvailabilityByTourId(admin, tourId);
  return slots.find((slot) => slot.date === slotDate) ?? null;
}

async function resolveMaxParticipantsCap(
  admin: DbClient,
  tourId: string,
  slotDate: string,
  requestedMax: number
): Promise<{ ok: true; maxParticipants: number; slot: TourAvailabilitySlot | null } | { ok: false; error: string }> {
  const slot = await fetchSlotForTourDate(admin, tourId, slotDate);
  if (!slot) {
    return { ok: true, maxParticipants: requestedMax, slot: null };
  }

  if (slot.status === "closed") {
    return { ok: false, error: "Выбранная дата закрыта для набора" };
  }

  if (slot.status === "sold_out" || slot.availableCount <= 0) {
    return { ok: false, error: "На выбранную дату нет свободных мест в слоте" };
  }

  const cappedMax = Math.min(requestedMax, slot.availableCount);
  if (cappedMax < 2) {
    return { ok: false, error: "Недостаточно мест в слоте для группового набора" };
  }

  return { ok: true, maxParticipants: cappedMax, slot };
}

async function countActiveMembers(admin: DbClient, listingId: string): Promise<number> {
  const { count, error } = await admin
    .from("group_trip_members")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .in("status", ACTIVE_MEMBER_STATUSES);

  if (error) return 0;
  return count ?? 0;
}

async function fetchMemberRows(admin: DbClient, listingId: string): Promise<MemberRow[]> {
  const { data, error } = await admin
    .from("group_trip_members")
    .select("*")
    .eq("listing_id", listingId)
    .order("joined_at", { ascending: true });

  if (error || !data) return [];
  return data;
}

async function fetchProfileNames(
  admin: DbClient,
  userIds: string[]
): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();

  const { data } = await admin
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", userIds);

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
    map.set(row.id, name || "Участник");
  }
  return map;
}

function toMemberView(row: MemberRow, names: Map<string, string>): GroupTripMemberView {
  return {
    id: row.id,
    userId: row.user_id,
    status: isActiveMemberStatus(row.status) ? row.status : "interested",
    joinedAt: row.joined_at,
    displayName: names.get(row.user_id),
  };
}

async function enrichListing(
  admin: DbClient,
  row: ListingRow,
  options?: {
    viewerUserId?: string | null;
    includeMembers?: boolean;
    tourMeta?: Map<string, { slug: string; title: string }>;
    slot?: TourAvailabilitySlot | null;
  }
): Promise<GroupTripListingView> {
  const memberCount = await countActiveMembers(admin, row.id);
  const tourInfo = options?.tourMeta?.get(row.tour_id);
  const slot =
    options?.slot !== undefined
      ? options.slot
      : await fetchSlotForTourDate(admin, row.tour_id, row.slot_date);

  let members: GroupTripMemberView[] | undefined;
  let myMemberStatus: GroupTripMemberStatus | null = null;

  if (options?.includeMembers) {
    const memberRows = await fetchMemberRows(admin, row.id);
    const names = await fetchProfileNames(
      admin,
      memberRows.map((member) => member.user_id)
    );
    members = memberRows
      .filter((member) => ACTIVE_MEMBER_STATUSES.includes(member.status as GroupTripMemberStatus))
      .map((member) => toMemberView(member, names));

    if (options.viewerUserId) {
      const mine = memberRows.find((member) => member.user_id === options.viewerUserId);
      myMemberStatus = mine && isActiveMemberStatus(mine.status) ? mine.status : null;
    }
  } else if (options?.viewerUserId) {
    const { data: mine } = await admin
      .from("group_trip_members")
      .select("status")
      .eq("listing_id", row.id)
      .eq("user_id", options.viewerUserId)
      .maybeSingle();
    myMemberStatus =
      mine && isActiveMemberStatus(mine.status) && mine.status !== "declined"
        ? mine.status
        : null;
  }

  return {
    id: row.id,
    tourId: row.tour_id,
    tourSlug: tourInfo?.slug,
    tourTitle: tourInfo?.title,
    organizerId: row.organizer_id,
    creatorUserId: row.creator_user_id,
    slotDate: row.slot_date,
    availabilitySlotId: row.availability_slot_id,
    minParticipants: row.min_participants,
    maxParticipants: row.max_participants,
    status: row.status as GroupTripListingStatus,
    description: row.description,
    memberCount,
    members,
    isCreator: options?.viewerUserId ? row.creator_user_id === options.viewerUserId : undefined,
    isMember: options?.viewerUserId ? Boolean(myMemberStatus) : undefined,
    myMemberStatus,
    slotCapacity: slot?.capacity ?? null,
    slotAvailable: slot?.availableCount ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchTourMetaMap(
  admin: DbClient,
  tourIds: string[]
): Promise<Map<string, { slug: string; title: string }>> {
  if (tourIds.length === 0) return new Map();

  const { data } = await admin
    .from("tours")
    .select("id, slug, title")
    .in("id", tourIds);

  const map = new Map<string, { slug: string; title: string }>();
  for (const row of data ?? []) {
    map.set(row.id, { slug: row.slug, title: row.title });
  }
  return map;
}

async function maybeNotifyMinReached(
  admin: DbClient,
  listing: ListingRow,
  memberCount: number
): Promise<void> {
  if (listing.min_reached_notified_at) return;
  if (memberCount < listing.min_participants) return;
  if (listing.status === "cancelled" || listing.status === "confirmed") return;

  const tourMeta = await fetchTourMetaMap(admin, [listing.tour_id]);
  const tourTitle = tourMeta.get(listing.tour_id)?.title ?? "Тур";
  const memberRows = await fetchMemberRows(admin, listing.id);
  const memberUserIds = memberRows
    .filter((member) => ACTIVE_MEMBER_STATUSES.includes(member.status as GroupTripMemberStatus))
    .map((member) => member.user_id);

  await emitGroupTripMinReachedNotifications(admin, {
    listingId: listing.id,
    tourTitle,
    slotDate: listing.slot_date,
    organizerUserId: listing.organizer_id,
    memberUserIds,
    memberCount,
    minParticipants: listing.min_participants,
  });

  await admin
    .from("group_trip_listings")
    .update({ min_reached_notified_at: new Date().toISOString() })
    .eq("id", listing.id);
}

async function syncListingCapacityStatus(
  admin: DbClient,
  listing: ListingRow,
  memberCount: number
): Promise<ListingRow> {
  let nextStatus: GroupTripListingStatus = listing.status as GroupTripListingStatus;

  if (listing.status === "open" || listing.status === "full") {
    nextStatus = memberCount >= listing.max_participants ? "full" : "open";
  }

  if (nextStatus !== listing.status) {
    const { data } = await admin
      .from("group_trip_listings")
      .update({ status: nextStatus })
      .eq("id", listing.id)
      .select("*")
      .single();
    if (data) return data;
  }

  return listing;
}

export async function listGroupTrips(
  admin: DbClient,
  filters: {
    tourId?: string;
    slotDate?: string;
    creatorUserId?: string;
    organizerId?: string;
    viewerUserId?: string | null;
    includeMembers?: boolean;
  }
): Promise<GroupTripListingView[]> {
  let query = admin
    .from("group_trip_listings")
    .select("*")
    .order("slot_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (filters.tourId) query = query.eq("tour_id", filters.tourId);
  if (filters.slotDate) query = query.eq("slot_date", filters.slotDate);
  if (filters.creatorUserId) query = query.eq("creator_user_id", filters.creatorUserId);
  if (filters.organizerId) query = query.eq("organizer_id", filters.organizerId);
  else query = query.neq("status", "cancelled");

  const { data, error } = await query;
  if (error || !data) return [];

  const tourMeta = await fetchTourMetaMap(admin, [...new Set(data.map((row) => row.tour_id))]);
  const listings: GroupTripListingView[] = [];

  for (const row of data) {
    listings.push(
      await enrichListing(admin, row, {
        viewerUserId: filters.viewerUserId,
        includeMembers: filters.includeMembers,
        tourMeta,
      })
    );
  }

  return listings;
}

export async function listGroupTripsForMember(
  admin: DbClient,
  userId: string
): Promise<GroupTripListingView[]> {
  const { data: memberships, error } = await admin
    .from("group_trip_members")
    .select("listing_id")
    .eq("user_id", userId)
    .in("status", ACTIVE_MEMBER_STATUSES);

  if (error || !memberships?.length) return [];

  const listingIds = [...new Set(memberships.map((row) => row.listing_id))];
  const { data: listings } = await admin
    .from("group_trip_listings")
    .select("*")
    .in("id", listingIds)
    .neq("status", "cancelled")
    .order("slot_date", { ascending: true });

  if (!listings?.length) return [];

  const tourMeta = await fetchTourMetaMap(admin, [...new Set(listings.map((row) => row.tour_id))]);
  const result: GroupTripListingView[] = [];
  for (const row of listings) {
    result.push(
      await enrichListing(admin, row, {
        viewerUserId: userId,
        includeMembers: true,
        tourMeta,
      })
    );
  }
  return result;
}

export async function getGroupTripById(
  admin: DbClient,
  listingId: string,
  viewerUserId?: string | null
): Promise<GroupTripListingView | null> {
  const { data, error } = await admin
    .from("group_trip_listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();

  if (error || !data) return null;

  const tourMeta = await fetchTourMetaMap(admin, [data.tour_id]);
  return enrichListing(admin, data, {
    viewerUserId,
    includeMembers: true,
    tourMeta,
  });
}

export async function createGroupTripListing(
  admin: DbClient,
  userId: string,
  input: CreateGroupTripListingInput
): Promise<{ listing: GroupTripListingView } | { error: string }> {
  const slotDate = toIsoDate(input.slotDate);
  if (!slotDate) return { error: "Некорректная дата слота" };

  const minParticipants = clampParticipants(input.minParticipants, 2, 50);
  const requestedMax = clampParticipants(input.maxParticipants, minParticipants, 50);

  const { data: tour, error: tourError } = await admin
    .from("tours")
    .select("id, owner_user_id, slug, title")
    .eq("id", input.tourId)
    .maybeSingle();

  if (tourError) return { error: tourError.message };
  if (!tour) return { error: "Тур не найден" };
  if (!tour.owner_user_id) return { error: "У тура не указан организатор" };

  const cap = await resolveMaxParticipantsCap(admin, tour.id, slotDate, requestedMax);
  if (!cap.ok) return { error: cap.error };

  const { data: inserted, error: insertError } = await admin
    .from("group_trip_listings")
    .insert({
      tour_id: tour.id,
      organizer_id: tour.owner_user_id,
      creator_user_id: userId,
      slot_date: slotDate,
      availability_slot_id: cap.slot?.id ?? null,
      min_participants: minParticipants,
      max_participants: cap.maxParticipants,
      status: "open",
      description: input.description?.trim() || null,
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    return { error: insertError?.message ?? "Не удалось создать набор группы" };
  }

  const { error: memberError } = await admin.from("group_trip_members").insert({
    listing_id: inserted.id,
    user_id: userId,
    status: "interested",
  });

  if (memberError) {
    await admin.from("group_trip_listings").delete().eq("id", inserted.id);
    return { error: memberError.message };
  }

  const memberCount = 1;
  await maybeNotifyMinReached(admin, inserted, memberCount);
  const synced = await syncListingCapacityStatus(admin, inserted, memberCount);

  const tourMeta = new Map([[tour.id, { slug: tour.slug, title: tour.title }]]);
  const listing = await enrichListing(admin, synced, {
    viewerUserId: userId,
    includeMembers: true,
    tourMeta,
    slot: cap.slot,
  });

  return { listing };
}

export async function joinGroupTripListing(
  admin: DbClient,
  listingId: string,
  userId: string
): Promise<{ listing: GroupTripListingView } | { error: string; status?: number }> {
  const { data: listing, error } = await admin
    .from("group_trip_listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();

  if (error) return { error: error.message, status: 500 };
  if (!listing) return { error: "Набор не найден", status: 404 };
  if (listing.status === "cancelled" || listing.status === "confirmed") {
    return { error: "Набор закрыт для новых участников", status: 409 };
  }
  if (listing.status === "full") {
    return { error: "Группа уже набрана", status: 409 };
  }

  const memberCount = await countActiveMembers(admin, listing.id);
  if (memberCount >= listing.max_participants) {
    await syncListingCapacityStatus(admin, listing, memberCount);
    return { error: "Группа уже набрана", status: 409 };
  }

  const { data: existing } = await admin
    .from("group_trip_members")
    .select("*")
    .eq("listing_id", listingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if (existing.status === "declined") {
      const { error: rejoinError } = await admin
        .from("group_trip_members")
        .update({ status: "interested" })
        .eq("id", existing.id);
      if (rejoinError) return { error: rejoinError.message, status: 500 };
    } else {
      return { error: "Вы уже в этом наборе", status: 409 };
    }
  } else {
    const { error: insertError } = await admin.from("group_trip_members").insert({
      listing_id: listingId,
      user_id: userId,
      status: "interested",
    });
    if (insertError) return { error: insertError.message, status: 500 };
  }

  const nextCount = await countActiveMembers(admin, listingId);
  await maybeNotifyMinReached(admin, listing, nextCount);
  const synced = await syncListingCapacityStatus(admin, listing, nextCount);
  const view = await getGroupTripById(admin, synced.id, userId);
  if (!view) return { error: "Не удалось загрузить набор", status: 500 };
  return { listing: view };
}

export async function leaveGroupTripListing(
  admin: DbClient,
  listingId: string,
  userId: string
): Promise<{ listing: GroupTripListingView } | { error: string; status?: number }> {
  const { data: member, error } = await admin
    .from("group_trip_members")
    .select("*")
    .eq("listing_id", listingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { error: error.message, status: 500 };
  if (!member || member.status === "declined") {
    return { error: "Вы не состоите в этом наборе", status: 404 };
  }

  const { error: updateError } = await admin
    .from("group_trip_members")
    .update({ status: "declined" })
    .eq("id", member.id);

  if (updateError) return { error: updateError.message, status: 500 };

  const { data: listing } = await admin
    .from("group_trip_listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();

  if (listing) {
    const nextCount = await countActiveMembers(admin, listingId);
    await syncListingCapacityStatus(admin, listing, nextCount);
  }

  const view = await getGroupTripById(admin, listingId, userId);
  if (!view) return { error: "Не удалось загрузить набор", status: 500 };
  return { listing: view };
}

export async function patchOrganizerGroupTripListing(
  admin: DbClient,
  listingId: string,
  organizerId: string,
  action: OrganizerGroupTripPatchAction
): Promise<{ listing: GroupTripListingView } | { error: string; status?: number }> {
  const { data: listing, error } = await admin
    .from("group_trip_listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();

  if (error) return { error: error.message, status: 500 };
  if (!listing) return { error: "Набор не найден", status: 404 };
  if (listing.organizer_id !== organizerId) {
    return { error: "Доступ запрещён", status: 403 };
  }

  if (action === "cancel") {
    const { error: cancelError } = await admin
      .from("group_trip_listings")
      .update({ status: "cancelled" })
      .eq("id", listingId);
    if (cancelError) return { error: cancelError.message, status: 500 };
  } else {
    const { error: confirmError } = await admin
      .from("group_trip_listings")
      .update({ status: "confirmed" })
      .eq("id", listingId);
    if (confirmError) return { error: confirmError.message, status: 500 };

    await admin
      .from("group_trip_members")
      .update({ status: "confirmed" })
      .eq("listing_id", listingId)
      .in("status", ["interested"]);
  }

  const view = await getGroupTripById(admin, listingId, organizerId);
  if (!view) return { error: "Не удалось загрузить набор", status: 500 };
  return { listing: view };
}
