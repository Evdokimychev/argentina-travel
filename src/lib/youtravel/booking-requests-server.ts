import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { YouTravelBookingRequestView } from "@/types/youtravel-booking";

type DbClient = SupabaseClient<Database>;

type RawYouTravelBookingRequestRow = {
  id: string;
  tour_id: number;
  tour_slug: string;
  user_id: string | null;
  offer_id: number | null;
  start_date: string;
  end_date: string | null;
  persons_count: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  message: string | null;
  youtravel_order_id: string | null;
  youtravel_order_url: string | null;
  youtravel_status: string | null;
  created_at: string;
};

type YouTravelTourBrief = {
  id: number;
  title: string;
  cover_image: string | null;
};

export type YouTravelBookingRequestInsert = {
  tourId: number;
  tourSlug: string;
  userId: string | null;
  offerId: number | null;
  startDate: string;
  endDate: string | null;
  personsCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string | null;
  youtravelOrderId: string | null;
  youtravelOrderUrl: string | null;
  youtravelStatus: string | null;
  priceSnapshot: unknown;
};

export type YouTravelBookingRequestAdminFilters = {
  status?: string;
  limit?: number;
};

type YouTravelBookingSelectFilters = {
  userId?: string;
  email?: string | null;
  status?: string;
  limit?: number;
};

function normalizeEmail(email: string | null | undefined): string | null {
  const value = email?.trim().toLowerCase();
  return value || null;
}

async function enrichYouTravelRequests(
  supabase: DbClient,
  rows: RawYouTravelBookingRequestRow[]
): Promise<YouTravelBookingRequestView[]> {
  if (rows.length === 0) return [];

  const tourIds = [...new Set(rows.map((row) => row.tour_id).filter(Number.isFinite))];
  const tourMap = new Map<number, YouTravelTourBrief>();

  if (tourIds.length > 0) {
    const { data } = await supabase
      .from("youtravel_tours")
      .select("id, title, cover_image")
      .in("id", tourIds);

    for (const row of data ?? []) {
      tourMap.set(row.id, {
        id: row.id,
        title: row.title,
        cover_image: row.cover_image,
      });
    }
  }

  return rows.map((row) => {
    const tour = tourMap.get(row.tour_id);
    return {
      id: row.id,
      tourId: row.tour_id,
      tourSlug: row.tour_slug,
      tourTitle: tour?.title?.trim() || row.tour_slug,
      tourCoverImage: tour?.cover_image ?? null,
      userId: row.user_id,
      offerId: row.offer_id,
      startDate: row.start_date,
      endDate: row.end_date,
      personsCount: row.persons_count,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      message: row.message,
      youtravelOrderId: row.youtravel_order_id,
      youtravelOrderUrl: row.youtravel_order_url,
      youtravelStatus: row.youtravel_status,
      createdAt: row.created_at,
    };
  });
}

async function selectYouTravelRequests(
  supabase: DbClient,
  filters: YouTravelBookingSelectFilters
): Promise<RawYouTravelBookingRequestRow[]> {
  const limit = Math.max(1, Math.min(filters.limit ?? 100, 500));
  const normalizedEmail = normalizeEmail(filters.email);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("youtravel_booking_requests")
    .select(
      [
        "id",
        "tour_id",
        "tour_slug",
        "user_id",
        "offer_id",
        "start_date",
        "end_date",
        "persons_count",
        "customer_name",
        "customer_email",
        "customer_phone",
        "message",
        "youtravel_order_id",
        "youtravel_order_url",
        "youtravel_status",
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
    query = query.eq("youtravel_status", filters.status);
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) return [];
  return data as RawYouTravelBookingRequestRow[];
}

export async function insertYouTravelBookingRequest(
  supabase: DbClient,
  input: YouTravelBookingRequestInsert
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("youtravel_booking_requests").insert({
    tour_id: input.tourId,
    tour_slug: input.tourSlug,
    user_id: input.userId,
    offer_id: input.offerId,
    start_date: input.startDate,
    end_date: input.endDate,
    persons_count: input.personsCount,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    message: input.message,
    youtravel_order_id: input.youtravelOrderId,
    youtravel_order_url: input.youtravelOrderUrl,
    youtravel_status: input.youtravelStatus,
    price_snapshot: input.priceSnapshot,
  });
}

export async function fetchYouTravelBookingRequestsForUser(
  supabase: DbClient,
  options: {
    userId: string;
    email?: string | null;
    limit?: number;
  }
): Promise<YouTravelBookingRequestView[]> {
  const byUser = await selectYouTravelRequests(supabase, {
    userId: options.userId,
    limit: options.limit,
  });

  const normalizedEmail = normalizeEmail(options.email);
  const byEmail = normalizedEmail
    ? await selectYouTravelRequests(supabase, {
        email: normalizedEmail,
        limit: options.limit,
      })
    : [];

  const merged = new Map<string, RawYouTravelBookingRequestRow>();
  for (const row of [...byUser, ...byEmail]) {
    merged.set(row.id, row);
  }

  const sorted = [...merged.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const limited = sorted.slice(0, options.limit ?? 50);
  return enrichYouTravelRequests(supabase, limited);
}

export async function fetchYouTravelBookingRequestsAdmin(
  supabase: DbClient,
  filters: YouTravelBookingRequestAdminFilters = {}
): Promise<YouTravelBookingRequestView[]> {
  const rows = await selectYouTravelRequests(supabase, {
    status: filters.status,
    limit: filters.limit,
  });
  return enrichYouTravelRequests(supabase, rows);
}

export async function fetchYouTravelBookingRequestsStatusStats(
  supabase: DbClient
): Promise<{ total: number; byStatus: Record<string, number> }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("youtravel_booking_requests")
    .select("youtravel_status");
  if (error || !Array.isArray(data)) return { total: 0, byStatus: {} };

  const byStatus: Record<string, number> = {};
  for (const row of data as Array<{ youtravel_status?: string | null }>) {
    const status = row.youtravel_status?.trim() || "unknown";
    byStatus[status] = (byStatus[status] ?? 0) + 1;
  }

  return {
    total: data.length,
    byStatus,
  };
}
