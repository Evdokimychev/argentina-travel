import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { buildDefaultTickets } from "@/lib/excursion-schedule";
import {
  createTripsterExternalOrder,
  TripsterBookingError,
} from "@/lib/tripster/booking-api";
import { isTripsterConfigured } from "@/lib/tripster/env";
import { fetchExcursionDetailServer } from "@/lib/tripster/excursion-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type RouteContext = { params: Promise<{ slug: string }> };

type BookBody = {
  date?: string;
  time?: string;
  personsCount?: number;
  name?: string;
  email?: string;
  phone?: string;
  messageToGuide?: string;
  userId?: string;
};

function normalizeTimeForApi(time: string): string {
  const normalized = time.trim();
  return normalized.length === 5 ? `${normalized}:00` : normalized;
}

export async function POST(request: Request, context: RouteContext) {
  if (!isTripsterConfigured()) {
    return NextResponse.json({ error: "Tripster is not configured." }, { status: 503 });
  }

  const { slug } = await context.params;
  const excursion = await fetchExcursionDetailServer(slug);
  if (!excursion) {
    return NextResponse.json({ error: "Excursion not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as BookBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const date = body.date?.trim();
  const time = body.time?.trim();
  const personsCount = body.personsCount ?? 1;
  const name = body.name?.trim();
  const email = body.email?.trim();
  const phone = body.phone?.trim();
  const messageToGuide = body.messageToGuide?.trim();

  if (!date || !time || !name || !email || !phone || personsCount < 1) {
    return NextResponse.json({ error: "Missing required booking fields." }, { status: 400 });
  }

  const tickets = buildDefaultTickets(excursion.ticketOptions, personsCount);
  const idempotencyKey = randomUUID();

  try {
    const order = await createTripsterExternalOrder(
      {
        experience: excursion.id,
        persons_count: personsCount,
        date,
        time: normalizeTimeForApi(time),
        tickets: tickets.length > 0 ? tickets : undefined,
        name,
        email,
        phone,
        message_to_guide: messageToGuide || undefined,
      },
      idempotencyKey
    );

    if (isSupabaseConfigured()) {
      try {
        const supabase = createSupabaseAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("tripster_booking_requests").insert({
          experience_id: excursion.id,
          experience_slug: excursion.slug,
          user_id: body.userId?.trim() || null,
          event_date: date,
          event_time: time,
          persons_count: personsCount,
          tickets,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          message_to_guide: messageToGuide || null,
          tripster_order_id: order.id,
          tripster_order_url: order.url ?? null,
          tripster_status: order.status,
          price_snapshot: order.price ?? null,
        });
      } catch {
        // Non-blocking persistence for CRM/analytics
      }
    }

    return NextResponse.json({
      ok: true,
      mode: "tripster_order",
      orderId: order.id,
      status: order.status,
      orderUrl: order.url,
      price: order.price,
    });
  } catch (error) {
    if (error instanceof TripsterBookingError) {
      if (error.status === 403 || error.status === 401) {
        return NextResponse.json({
          ok: false,
          mode: "affiliate_fallback",
          fallbackUrl: `/api/affiliate/go/${slug}`,
          error: "External booking API unavailable. Redirecting to partner site.",
        });
      }

      return NextResponse.json(
        {
          ok: false,
          error: "Booking failed.",
          details: error.details,
        },
        { status: error.status >= 400 && error.status < 600 ? error.status : 400 }
      );
    }

    return NextResponse.json({ error: "Booking failed." }, { status: 502 });
  }
}
