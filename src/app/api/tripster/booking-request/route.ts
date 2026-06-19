import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchExcursionDetailServer } from "@/lib/excursion-server";
import { buildDefaultTickets } from "@/lib/excursion-schedule";
import {
  createTripsterExternalOrder,
  TripsterBookingError,
} from "@/lib/tripster/booking-api";
import { isTripsterConfigured } from "@/lib/tripster/env";
import {
  fetchTripsterBookingRequestsForUser,
  insertTripsterBookingRequest,
} from "@/lib/tripster/booking-requests-server";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";

type BookingRequestBody = {
  slug?: string;
  date?: string;
  time?: string;
  personsCount?: number;
  name?: string;
  email?: string;
  phone?: string;
  messageToGuide?: string;
};

function normalizeTimeForApi(time: string): string {
  const normalized = time.trim();
  return normalized.length === 5 ? `${normalized}:00` : normalized;
}

function buildAffiliateFallbackUrl(input: {
  slug: string;
  date: string;
  time: string;
  personsCount: number;
}): string {
  const search = new URLSearchParams({
    start_date: input.date,
    time: input.time,
    guests: String(input.personsCount),
  });
  return `/api/affiliate/go/${input.slug}?${search.toString()}`;
}

async function persistTripsterRequest(
  input: BookingRequestBody & {
    slug: string;
    experienceId: number;
    userId: string | null;
    date: string;
    time: string;
    personsCount: number;
    tickets: Array<{ id: number; count: number }>;
    name: string;
    email: string;
    phone: string;
    status: string;
    orderId?: number | null;
    orderUrl?: string | null;
    priceSnapshot?: unknown;
  }
) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createSupabaseAdminClient();
    await insertTripsterBookingRequest(supabase, {
      experienceId: input.experienceId,
      experienceSlug: input.slug,
      userId: input.userId,
      eventDate: input.date,
      eventTime: input.time,
      personsCount: input.personsCount,
      tickets: input.tickets,
      customerName: input.name,
      customerEmail: input.email,
      customerPhone: input.phone,
      messageToGuide: input.messageToGuide?.trim() || null,
      tripsterOrderId: input.orderId ?? null,
      tripsterOrderUrl: input.orderUrl ?? null,
      tripsterStatus: input.status,
      priceSnapshot: input.priceSnapshot ?? null,
    });
  } catch {
    // CRM persistence should not break user booking flow.
  }
}

async function postTripsterBookingRequest(request: Request) {
  const body = (await request.json().catch(() => null)) as BookingRequestBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const slug = body.slug?.trim();
  const date = body.date?.trim();
  const time = body.time?.trim();
  const personsCount = body.personsCount ?? 1;
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.trim();
  const messageToGuide = body.messageToGuide?.trim();

  if (!slug || !date || !time || !name || !email || !phone || personsCount < 1) {
    return NextResponse.json({ error: "Missing required booking fields." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const excursion = await fetchExcursionDetailServer(slug);
  if (!excursion) {
    return NextResponse.json({ error: "Excursion not found." }, { status: 404 });
  }
  if (excursion.partner !== "tripster") {
    return NextResponse.json({ error: "Tripster booking is not supported for this excursion." }, { status: 400 });
  }

  const fallbackUrl = buildAffiliateFallbackUrl({ slug, date, time, personsCount });
  const tickets = buildDefaultTickets(excursion.ticketOptions, personsCount);

  if (!isTripsterConfigured()) {
    await persistTripsterRequest({
      ...body,
      slug,
      experienceId: excursion.id,
      userId: authUser.id,
      date,
      time,
      personsCount,
      tickets,
      name,
      email,
      phone,
      status: "affiliate_fallback",
    });
    return NextResponse.json({
      ok: false,
      mode: "affiliate_fallback",
      fallbackUrl,
      error: "Tripster API unavailable. Redirecting to partner site.",
    });
  }

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

    await persistTripsterRequest({
      ...body,
      slug,
      experienceId: excursion.id,
      userId: authUser.id,
      date,
      time,
      personsCount,
      tickets,
      name,
      email,
      phone,
      status: order.status ?? "pending",
      orderId: order.id,
      orderUrl: order.url ?? null,
      priceSnapshot: order.price ?? null,
    });

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
      if (error.status === 401 || error.status === 403 || error.status === 503) {
        await persistTripsterRequest({
          ...body,
          slug,
          experienceId: excursion.id,
          userId: authUser.id,
          date,
          time,
          personsCount,
          tickets,
          name,
          email,
          phone,
          status: "affiliate_fallback",
          priceSnapshot: error.details,
        });
        return NextResponse.json({
          ok: false,
          mode: "affiliate_fallback",
          fallbackUrl,
          error: "External booking API unavailable. Redirecting to partner site.",
        });
      }

      await persistTripsterRequest({
        ...body,
        slug,
        experienceId: excursion.id,
        userId: authUser.id,
        date,
        time,
        personsCount,
        tickets,
        name,
        email,
        phone,
        status: "failed",
        priceSnapshot: error.details,
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Booking failed.",
          details: error.details,
        },
        { status: error.status >= 400 && error.status < 600 ? error.status : 400 }
      );
    }

    await persistTripsterRequest({
      ...body,
      slug,
      experienceId: excursion.id,
      userId: authUser.id,
      date,
      time,
      personsCount,
      tickets,
      name,
      email,
      phone,
      status: "failed",
    });

    return NextResponse.json({ error: "Booking failed." }, { status: 502 });
  }
}

export const POST = withRateLimit(postTripsterBookingRequest, {
  limit: 10,
  window: 60_000,
  keyPrefix: "tripster-booking:create",
  key: (request) => `ip:${getClientIp(request)}`,
  message: "Слишком много попыток бронирования. Повторите позже.",
});

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ requests: [] });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const requests = await fetchTripsterBookingRequestsForUser(admin, {
    userId: authUser.id,
    email: authUser.email,
    limit: 50,
  });

  return NextResponse.json({ requests });
}
