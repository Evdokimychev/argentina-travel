import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { parseExcursionSlug } from "@/lib/excursion-slug";
import { buildDefaultTickets } from "@/lib/excursion-schedule";
import { fetchExcursionDetailServer } from "@/lib/excursion-server";
import {
  createTripsterExternalOrder,
  TripsterBookingError,
} from "@/lib/tripster/booking-api";
import { isTripsterConfigured } from "@/lib/tripster/env";
import {
  createSputnik8Order,
  Sputnik8BookingError,
} from "@/lib/sputnik8/booking-api";
import { fetchSputnik8Events } from "@/lib/sputnik8/client";
import { isSputnik8Configured } from "@/lib/sputnik8/env";
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
  eventId?: number;
};

function normalizeTimeForApi(time: string): string {
  const normalized = time.trim();
  return normalized.length === 5 ? `${normalized}:00` : normalized;
}

async function resolveSputnik8EventId(
  productId: number,
  date: string,
  time: string,
  explicitEventId?: number
): Promise<number | null> {
  if (explicitEventId) return explicitEventId;

  const events = await fetchSputnik8Events(productId);
  const match = events.find((item) => {
    const eventDate = item.date ?? item.datetime?.slice(0, 10) ?? item.starts_at?.slice(0, 10);
    const eventTime = item.time ?? item.datetime?.slice(11, 16) ?? item.starts_at?.slice(11, 16);
    return eventDate === date && eventTime?.startsWith(time.slice(0, 5));
  });

  return match?.id ?? events[0]?.id ?? null;
}

export async function POST(request: Request, context: RouteContext) {
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
  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const messageToGuide = body.messageToGuide?.trim();

  if (!date || !time || personsCount < 1) {
    return NextResponse.json({ error: "Missing required booking fields." }, { status: 400 });
  }

  // Контактные данные больше не собираются в форме (см. ENABLE_PARTNER_CONTACT_FORM).
  // Без них заказ через External Orders создать нельзя — отправляем туриста
  // на сайт партнёра, где он заполнит контакты сам.
  const hasContactInput = Boolean(name || email || phone);

  const parsed = parseExcursionSlug(slug);

  if (parsed?.partner === "sputnik8" || excursion.partner === "sputnik8") {
    if (!hasContactInput || !isSputnik8Configured()) {
      return NextResponse.json({
        ok: false,
        mode: "affiliate_fallback",
        fallbackUrl: `/api/affiliate/go/${slug}`,
        error: "Sputnik8 booking API unavailable. Redirecting to partner site.",
      });
    }

    const idempotencyKey = randomUUID();

    try {
      const eventId = await resolveSputnik8EventId(excursion.id, date, time, body.eventId);
      if (!eventId) {
        return NextResponse.json({
          ok: false,
          mode: "affiliate_fallback",
          fallbackUrl: `/api/affiliate/go/${slug}`,
          error: "No available event. Redirecting to partner site.",
        });
      }

      const order = await createSputnik8Order(
        {
          event_id: eventId,
          name,
          email,
          phone,
          persons_count: personsCount,
          comment: messageToGuide || undefined,
        },
        idempotencyKey
      );

      if (isSupabaseConfigured()) {
        try {
          const supabase = createSupabaseAdminClient();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("sputnik8_booking_requests").insert({
            product_id: excursion.id,
            product_slug: excursion.slug,
            user_id: body.userId?.trim() || null,
            event_id: eventId,
            event_date: date,
            event_time: time,
            persons_count: personsCount,
            customer_name: name,
            customer_email: email,
            customer_phone: phone,
            comment: messageToGuide || null,
            sputnik8_order_id: order.id,
            sputnik8_order_url: order.url ?? order.payment_url ?? null,
            sputnik8_status: order.status,
            price_snapshot: order.price ?? null,
          });
        } catch {
          // Non-blocking persistence
        }
      }

      return NextResponse.json({
        ok: true,
        mode: "sputnik8_order",
        orderId: order.id,
        status: order.status,
        orderUrl: order.url ?? order.payment_url,
        price: order.price,
      });
    } catch (error) {
      if (error instanceof Sputnik8BookingError) {
        if (error.status === 403 || error.status === 401 || error.status === 503) {
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

      return NextResponse.json({
        ok: false,
        mode: "affiliate_fallback",
        fallbackUrl: `/api/affiliate/go/${slug}`,
        error: "Booking failed. Redirecting to partner site.",
      });
    }
  }

  if (!hasContactInput || !isTripsterConfigured()) {
    return NextResponse.json({
      ok: false,
      mode: "affiliate_fallback",
      fallbackUrl: `/api/affiliate/go/${slug}`,
      error: "Tripster booking API unavailable. Redirecting to partner site.",
    });
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
