import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchExcursionDetailServer } from "@/lib/excursion-server";
import { fetchPartnerTourDetailServer } from "@/lib/tripster/partner-tour-server";
import { isPartnerTourDetail } from "@/lib/tripster/partner-tour-utils";
import { buildDefaultTickets } from "@/lib/excursion-schedule";
import {
  createTripsterExternalOrder,
  TripsterBookingError,
} from "@/lib/tripster/booking-api";
import { fetchTripsterExperience } from "@/lib/tripster/client";
import { parseExcursionPayload } from "@/lib/tripster/excursion-payload";
import { isTripsterConfigured } from "@/lib/tripster/env";
import {
  fetchTripsterBookingRequestsForUser,
  insertTripsterBookingRequest,
} from "@/lib/tripster/booking-requests-server";
import {
  buildTripsterBookingContactPayload,
} from "@/lib/tripster/booking-contact";
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
  productType?: "excursion" | "tour";
  userId?: string;
};

function normalizeTimeForApi(time: string): string {
  const normalized = time.trim();
  return normalized.length === 5 ? `${normalized}:00` : normalized;
}

async function resolveBookingTicketOptions(input: {
  excursionTicketOptions?: Array<{ id: number; isDefault?: boolean }>;
  experienceId: number;
}): Promise<Array<{ id: number; isDefault?: boolean }>> {
  if (input.excursionTicketOptions?.length) {
    return input.excursionTicketOptions;
  }

  try {
    const experience = await fetchTripsterExperience(input.experienceId, {
      priceFormat: "detailed",
    });
    return parseExcursionPayload(experience).ticketOptions;
  } catch {
    return [];
  }
}

function buildAffiliateFallbackUrl(input: {
  slug: string;
  date: string;
  time: string;
  personsCount: number;
  name?: string;
  email?: string;
  phone?: string;
}): string {
  const search = new URLSearchParams({
    start_date: input.date,
    time: input.time,
    guests: String(input.personsCount),
  });
  if (input.name) search.set("name", input.name);
  if (input.email) search.set("email", input.email);
  if (input.phone) search.set("phone", input.phone);
  return `/api/affiliate/go/${input.slug}?${search.toString()}`;
}

function resolveAffiliateFallbackReason(status?: number): string {
  if (status === 403) return "external_orders_forbidden";
  if (status === 401) return "external_orders_unauthorized";
  return "api_unavailable";
}

async function persistTripsterRequest(
  input: Omit<BookingRequestBody, "userId"> & {
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
  const messageToGuide = body.messageToGuide?.trim();

  if (!slug || !date || !time || personsCount < 1) {
    return NextResponse.json({ error: "Missing required booking fields." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const userId = authUser?.id ?? body.userId?.trim() ?? null;
  let profileCountry: string | null = null;

  if (authUser) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("country")
      .eq("id", authUser.id)
      .maybeSingle();
    profileCountry = profile?.country ?? null;
  }

  const contact = buildTripsterBookingContactPayload({
    name: body.name ?? "",
    email: body.email ?? "",
    phone: body.phone ?? "",
    messageToGuide,
    profileCountry,
  });

  if ("error" in contact) {
    return NextResponse.json({ error: contact.error }, { status: 400 });
  }

  const { name, email, phone } = contact;

  const excursion = await fetchExcursionDetailServer(slug);
  const partnerTour =
    !excursion || excursion.partner !== "tripster"
      ? await fetchPartnerTourDetailServer(slug)
      : null;

  let experienceId: number | null = null;

  if (excursion?.partner === "tripster") {
    experienceId = excursion.id;
  } else if (partnerTour && isPartnerTourDetail(partnerTour) && partnerTour.partnerExperienceId) {
    experienceId = partnerTour.partnerExperienceId;
  }

  if (!experienceId) {
    return NextResponse.json({ error: "Tripster product not found." }, { status: 404 });
  }

  const fallbackUrl = buildAffiliateFallbackUrl({
    slug,
    date,
    time,
    personsCount,
    name,
    email,
    phone,
  });
  const ticketOptions = await resolveBookingTicketOptions({
    excursionTicketOptions: excursion?.ticketOptions,
    experienceId,
  });
  const tickets = buildDefaultTickets(ticketOptions, personsCount);

  if (!isTripsterConfigured()) {
    await persistTripsterRequest({
      ...body,
      slug,
      experienceId,
      userId: authUser?.id ?? userId,
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
      fallbackReason: "api_not_configured",
      error:
        "Сервис бронирования Tripster сейчас недоступен — переходим на сайт партнёра с выбранной датой и числом туристов.",
    });
  }

  const idempotencyKey = randomUUID();

  try {
    const order = await createTripsterExternalOrder(
      {
        experience: experienceId,
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
      experienceId,
      userId: authUser?.id ?? userId,
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
      const isInfraError =
        error.status === 401 || error.status === 403 || error.status === 503;

      await persistTripsterRequest({
        ...body,
        slug,
        experienceId,
        userId: authUser?.id ?? userId,
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
        fallbackReason: isInfraError
          ? resolveAffiliateFallbackReason(error.status)
          : "api_booking_rejected",
        tripsterStatus: error.status,
        error: isInfraError
          ? error.status === 403
            ? "API создания заказов Tripster не подключён к партнёрскому аккаунту."
            : "Сервис бронирования Tripster временно недоступен — переходим на сайт партнёра с выбранной датой и числом туристов."
          : "Не удалось создать заказ через API Tripster — переходим на сайт партнёра с заполненными данными.",
      });
    }

    await persistTripsterRequest({
      ...body,
      slug,
      experienceId,
      userId: authUser?.id ?? userId,
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
      fallbackReason: "api_unavailable",
      error: "Сервис бронирования Tripster временно недоступен — переходим на сайт партнёра с заполненными данными.",
    });
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
