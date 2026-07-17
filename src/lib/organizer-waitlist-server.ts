import type { SupabaseClient } from "@supabase/supabase-js";
import { ORGANIZER_WAITLIST_TRANSITIONS } from "@/data/waitlist-statuses";
import type { Database, Json } from "@/types/database";
import type {
  WaitlistEntry,
  WaitlistOrganizerComment,
  WaitlistStatus,
  WaitlistStatusChange,
} from "@/types/waitlist";

type DbClient = SupabaseClient<Database>;
type WaitlistRow = Database["public"]["Tables"]["tour_waitlist_entries"]["Row"];

type TourSummary = {
  id: string;
  slug: string;
  title: string;
  owner_user_id: string;
  listing: Json | null;
  approved_listing: Json | null;
};

const WAITLIST_STATUSES: WaitlistStatus[] = [
  "waiting",
  "contacted",
  "offered",
  "declined",
  "cancelled",
  "converted",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function imageFromTour(tour: TourSummary): string {
  const listing = isRecord(tour.approved_listing)
    ? tour.approved_listing
    : isRecord(tour.listing)
      ? tour.listing
      : null;
  const image = listing?.image;
  return typeof image === "string" && image.trim()
    ? image
    : "/media/home/hero-mobile.webp";
}

function isWaitlistStatus(value: unknown): value is WaitlistStatus {
  return typeof value === "string" && WAITLIST_STATUSES.includes(value as WaitlistStatus);
}

function parseStatusHistory(value: Json, row: WaitlistRow): WaitlistStatusChange[] {
  if (Array.isArray(value)) {
    const items = value.flatMap((item): WaitlistStatusChange[] => {
      if (!isRecord(item) || !isWaitlistStatus(item.to)) return [];
      const changedBy = item.changedBy;
      if (changedBy !== "organizer" && changedBy !== "tourist" && changedBy !== "system") {
        return [];
      }
      return [{
        id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
        from: item.from === null || isWaitlistStatus(item.from) ? item.from : null,
        to: item.to,
        changedAt: typeof item.changedAt === "string" ? item.changedAt : row.updated_at,
        changedBy,
        note: typeof item.note === "string" && item.note.trim() ? item.note.trim() : undefined,
      }];
    });
    if (items.length) return items;
  }
  return [{
    id: `initial-${row.id}`,
    from: null,
    to: isWaitlistStatus(row.status) ? row.status : "waiting",
    changedAt: row.created_at,
    changedBy: "system",
  }];
}

function parseOrganizerComments(value: Json): WaitlistOrganizerComment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): WaitlistOrganizerComment[] => {
    if (!isRecord(item) || typeof item.text !== "string" || !item.text.trim()) return [];
    return [{
      id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
      text: item.text.trim(),
      authorName:
        typeof item.authorName === "string" && item.authorName.trim()
          ? item.authorName.trim()
          : "Организатор",
      createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    }];
  });
}

export function mapRemoteWaitlistEntry(row: WaitlistRow, tour: TourSummary): WaitlistEntry {
  const status = isWaitlistStatus(row.status) ? row.status : "waiting";
  return {
    id: row.id,
    userId: row.user_id ?? row.email ?? "guest",
    organizerTourId: tour.id,
    tourId: tour.id,
    tourSlug: tour.slug,
    tourTitle: tour.title,
    tourImage: imageFromTour(tour),
    startDate: row.slot_date ?? undefined,
    endDate: row.slot_date ?? undefined,
    guests: row.guests,
    contactName: row.contact_name?.trim() || row.email?.trim() || "Турист",
    contactEmail: row.email?.trim() || "",
    contactPhone: row.contact_phone?.trim() || "",
    touristComment: row.note?.trim() || undefined,
    status,
    statusHistory: parseStatusHistory(row.status_history, row),
    organizerComments: parseOrganizerComments(row.organizer_comments),
    convertedBookingId: row.converted_booking_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function canOrganizerTransitionWaitlistStatus(
  current: WaitlistStatus,
  next: WaitlistStatus
): boolean {
  if (current === next) return true;
  const allowed = ORGANIZER_WAITLIST_TRANSITIONS[
    current as keyof typeof ORGANIZER_WAITLIST_TRANSITIONS
  ];
  return Array.isArray(allowed) && allowed.includes(next as never);
}

async function fetchOrganizerTours(admin: DbClient, organizerId: string): Promise<TourSummary[]> {
  const { data, error } = await admin
    .from("tours")
    .select("id, slug, title, owner_user_id, listing, approved_listing")
    .eq("owner_user_id", organizerId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchOrganizerWaitlist(
  admin: DbClient,
  organizerId: string
): Promise<WaitlistEntry[]> {
  const tours = await fetchOrganizerTours(admin, organizerId);
  if (!tours.length) return [];
  const tourById = new Map(tours.map((tour) => [tour.id, tour]));
  const { data, error } = await admin
    .from("tour_waitlist_entries")
    .select("*")
    .in("tour_id", tours.map((tour) => tour.id))
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const tour = tourById.get(row.tour_id);
    return tour ? [mapRemoteWaitlistEntry(row, tour)] : [];
  });
}

export async function fetchOrganizerWaitlistEntry(
  admin: DbClient,
  organizerId: string,
  waitlistId: string
): Promise<WaitlistEntry | null> {
  const { data: row, error } = await admin
    .from("tour_waitlist_entries")
    .select("*")
    .eq("id", waitlistId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;
  const { data: tour, error: tourError } = await admin
    .from("tours")
    .select("id, slug, title, owner_user_id, listing, approved_listing")
    .eq("id", row.tour_id)
    .eq("owner_user_id", organizerId)
    .maybeSingle();
  if (tourError) throw new Error(tourError.message);
  return tour ? mapRemoteWaitlistEntry(row, tour) : null;
}

export async function updateOrganizerWaitlistStatus(input: {
  admin: DbClient;
  organizerId: string;
  waitlistId: string;
  status: WaitlistStatus;
}): Promise<WaitlistEntry | null> {
  const current = await fetchOrganizerWaitlistEntry(
    input.admin,
    input.organizerId,
    input.waitlistId
  );
  if (!current) return null;
  if (!canOrganizerTransitionWaitlistStatus(current.status, input.status)) {
    throw new Error("Недопустимый переход статуса");
  }
  const changedAt = new Date().toISOString();
  const history: WaitlistStatusChange[] = current.status === input.status
    ? current.statusHistory
    : [...current.statusHistory, {
        id: crypto.randomUUID(),
        from: current.status,
        to: input.status,
        changedAt,
        changedBy: "organizer",
      }];
  const { error } = await input.admin
    .from("tour_waitlist_entries")
    .update({ status: input.status, status_history: history as unknown as Json })
    .eq("id", input.waitlistId);
  if (error) throw new Error(error.message);
  return fetchOrganizerWaitlistEntry(input.admin, input.organizerId, input.waitlistId);
}

export async function addOrganizerWaitlistComment(input: {
  admin: DbClient;
  organizerId: string;
  waitlistId: string;
  text: string;
  authorName: string;
}): Promise<WaitlistEntry | null> {
  const current = await fetchOrganizerWaitlistEntry(
    input.admin,
    input.organizerId,
    input.waitlistId
  );
  if (!current) return null;
  const comment: WaitlistOrganizerComment = {
    id: crypto.randomUUID(),
    text: input.text.trim(),
    authorName: input.authorName.trim() || "Организатор",
    createdAt: new Date().toISOString(),
  };
  const comments = [comment, ...current.organizerComments].slice(0, 100);
  const { error } = await input.admin
    .from("tour_waitlist_entries")
    .update({ organizer_comments: comments as unknown as Json })
    .eq("id", input.waitlistId);
  if (error) throw new Error(error.message);
  return fetchOrganizerWaitlistEntry(input.admin, input.organizerId, input.waitlistId);
}
