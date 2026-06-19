import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { TripsterBookingRequestView } from "@/types/tripster-booking";

type DbClient = SupabaseClient<Database>;

type RawTripsterBookingRequestRow = {
  id: string;
  experience_id: number;
  experience_slug: string;
  user_id: string | null;
  event_date: string;
  event_time: string;
  persons_count: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  message_to_guide: string | null;
  tripster_order_id: number | null;
  tripster_order_url: string | null;
  tripster_status: string | null;
  created_at: string;
};

type TripsterExperienceBrief = {
  id: number;
  title: string;
  cover_image: string | null;
};

export type TripsterBookingRequestInsert = {
  experienceId: number;
  experienceSlug: string;
  userId: string | null;
  eventDate: string;
  eventTime: string;
  personsCount: number;
  tickets: Array<{ id: number; count: number }>;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  messageToGuide: string | null;
  tripsterOrderId: number | null;
  tripsterOrderUrl: string | null;
  tripsterStatus: string | null;
  priceSnapshot: unknown;
};

export type TripsterBookingRequestAdminFilters = {
  status?: string;
  limit?: number;
};

type TripsterBookingSelectFilters = {
  userId?: string;
  email?: string | null;
  status?: string;
  limit?: number;
};

function normalizeEmail(email: string | null | undefined): string | null {
  const value = email?.trim().toLowerCase();
  return value || null;
}

async function enrichTripsterRequests(
  supabase: DbClient,
  rows: RawTripsterBookingRequestRow[]
): Promise<TripsterBookingRequestView[]> {
  if (rows.length === 0) return [];

  const experienceIds = [...new Set(rows.map((row) => row.experience_id).filter(Number.isFinite))];
  const experienceMap = new Map<number, TripsterExperienceBrief>();

  if (experienceIds.length > 0) {
    const { data } = await supabase
      .from("tripster_experiences")
      .select("id, title, cover_image")
      .in("id", experienceIds);

    for (const row of data ?? []) {
      experienceMap.set(row.id, {
        id: row.id,
        title: row.title,
        cover_image: row.cover_image,
      });
    }
  }

  return rows.map((row) => {
    const experience = experienceMap.get(row.experience_id);
    return {
      id: row.id,
      experienceId: row.experience_id,
      experienceSlug: row.experience_slug,
      experienceTitle: experience?.title?.trim() || row.experience_slug,
      experienceCoverImage: experience?.cover_image ?? null,
      userId: row.user_id,
      eventDate: row.event_date,
      eventTime: row.event_time,
      personsCount: row.persons_count,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      messageToGuide: row.message_to_guide,
      tripsterOrderId: row.tripster_order_id,
      tripsterOrderUrl: row.tripster_order_url,
      tripsterStatus: row.tripster_status,
      createdAt: row.created_at,
    };
  });
}

async function selectTripsterRequests(
  supabase: DbClient,
  filters: TripsterBookingSelectFilters
): Promise<RawTripsterBookingRequestRow[]> {
  const limit = Math.max(1, Math.min(filters.limit ?? 100, 500));
  const normalizedEmail = normalizeEmail(filters.email);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("tripster_booking_requests")
    .select(
      [
        "id",
        "experience_id",
        "experience_slug",
        "user_id",
        "event_date",
        "event_time",
        "persons_count",
        "customer_name",
        "customer_email",
        "customer_phone",
        "message_to_guide",
        "tripster_order_id",
        "tripster_order_url",
        "tripster_status",
        "created_at",
      ].join(",")
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }
  if (normalizedEmail) {
    query = query.ilike("customer_email", normalizedEmail);
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("tripster_status", filters.status);
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) return [];
  return data as RawTripsterBookingRequestRow[];
}

export async function insertTripsterBookingRequest(
  supabase: DbClient,
  input: TripsterBookingRequestInsert
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("tripster_booking_requests").insert({
    experience_id: input.experienceId,
    experience_slug: input.experienceSlug,
    user_id: input.userId,
    event_date: input.eventDate,
    event_time: input.eventTime,
    persons_count: input.personsCount,
    tickets: input.tickets,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    message_to_guide: input.messageToGuide,
    tripster_order_id: input.tripsterOrderId,
    tripster_order_url: input.tripsterOrderUrl,
    tripster_status: input.tripsterStatus,
    price_snapshot: input.priceSnapshot,
  });
}

export async function fetchTripsterBookingRequestsForUser(
  supabase: DbClient,
  options: {
    userId: string;
    email?: string | null;
    limit?: number;
  }
): Promise<TripsterBookingRequestView[]> {
  const byUser = await selectTripsterRequests(supabase, {
    userId: options.userId,
    limit: options.limit,
  });

  const normalizedEmail = normalizeEmail(options.email);
  const byEmail = normalizedEmail
    ? await selectTripsterRequests(supabase, {
        email: normalizedEmail,
        limit: options.limit,
      })
    : [];

  const merged = new Map<string, RawTripsterBookingRequestRow>();
  for (const row of [...byUser, ...byEmail]) {
    merged.set(row.id, row);
  }

  const sorted = [...merged.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const limited = sorted.slice(0, options.limit ?? 50);
  return enrichTripsterRequests(supabase, limited);
}

export async function fetchTripsterBookingRequestsAdmin(
  supabase: DbClient,
  filters: TripsterBookingRequestAdminFilters = {}
): Promise<TripsterBookingRequestView[]> {
  const rows = await selectTripsterRequests(supabase, {
    status: filters.status,
    limit: filters.limit,
  });
  return enrichTripsterRequests(supabase, rows);
}

export async function fetchTripsterBookingRequestsStatusStats(
  supabase: DbClient
): Promise<{ total: number; byStatus: Record<string, number> }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from("tripster_booking_requests").select("tripster_status");
  if (error || !Array.isArray(data)) return { total: 0, byStatus: {} };

  const byStatus: Record<string, number> = {};
  for (const row of data as Array<{ tripster_status?: string | null }>) {
    const status = row.tripster_status?.trim() || "unknown";
    byStatus[status] = (byStatus[status] ?? 0) + 1;
  }

  return {
    total: data.length,
    byStatus,
  };
}
