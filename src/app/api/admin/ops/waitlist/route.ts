import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const STATUSES = new Set(["waiting", "contacted", "offered", "converted", "closed", "cancelled"]);

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.trim() || "waiting";
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit")) || 50));
  const supabase = createSupabaseAdminClient();
  // New workflow fields are present after the operations migration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("tour_waitlist_entries")
    .select("id, tour_id, user_id, email, contact_name, contact_phone, slot_date, guests, status, source, note, assigned_to, converted_booking_id, version, contacted_at, closed_at, created_at, updated_at, tours(title, slug)")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (STATUSES.has(status)) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Не удалось прочитать лист ожидания" }, { status: 500 });
  const items = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    tourId: row.tour_id,
    tour: row.tours,
    email: row.email,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    slotDate: row.slot_date,
    guests: row.guests,
    status: row.status,
    source: row.source,
    note: row.note,
    assignedTo: row.assigned_to,
    convertedBookingId: row.converted_booking_id,
    version: row.version,
    contactedAt: row.contacted_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
  return NextResponse.json({ items, generatedAt: new Date().toISOString() });
}
