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
import { resolveTripsterCheckoutUrl, buildTripsterExperiencePageUrl } from "@/lib/tripster/checkout-url";
import {
  resolveTripsterAffiliateCheckoutUrl,
  wrapTripsterUrlWithAffiliate,
} from "@/lib/tripster/checkout-url-server";
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

async function buildAffiliateFallbackUrl(input: {
  supabase: ReturnType<typeof createSupabaseAdminClient> | null;
  experienceId: number;
  slug: string;
  cityId?: number | null;
  tripsterUrl?: string | null;
  date: string;
  time: string;
  personsCount: number;
  name?: string;
  email?: string;
  phone?: string;
  messageToGuide?: string;
}): Promise<string> {
  return resolveTripsterAffiliateCheckoutUrl(input.supabase, {
    experienceId: input.experienceId,
    experienceSlug: input.slug,
    cityId: input.cityId,
    tripsterUrl: input.tripsterUrl,
    startDate: input.date,
    time: input.time,
    guests: input.personsCount,
    name: input.name,
    email: input.email,
    phone: input.phone,
    messageToGuide: input.messageToGuide,
  });
}

function resolveAffiliateFallbackReason(status?: number): string {
  if (status === 403) return "external_orders_forbidden";
  if (status === 401) return "external_orders_unauthorized";
  return "api_unavailable";
}

async function resolveTripsterExperienceMeta(
  supabase: ReturnType<typeof createSupabaseAdminClient> | null,
  experienceId: number
): Promise<{ cityId: number | null; tripsterUrl: string }> {
  const fallbackPageUrl = buildTripsterExperiencePageUrl(experienceId);

  if (!supabase) {
    return { cityId: null, tripsterUrl: fallbackPageUrl };
  }

  try {
    const { data } = await supabase
      .from("tripster_experiences")
      .select("city_id, tripster_url")
      .eq("id", experienceId)
      .maybeSingle();

    return {
      cityId: data?.city_id ?? null,
      tripsterUrl: data?.tripster_url?.trim() || fallbackPageUrl,
    };
  } catch {
    return { cityId: null, tripsterUrl: fallbackPageUrl };
  }
}

async function resolveAffiliateOrderUrl(
  supabase: ReturnType<typeof createSupabaseAdminClient> | null,
  input: {
    experienceId: number;
    cityId: number | null;
    orderUrl: string;
  }
): Promise<string> {
  return wrapTripsterUrlWithAffiliate(supabase, {
    experienceId: input.experienceId,
    cityId: input.cityId,
    tripsterUrl: input.orderUrl,
  });
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

  // Контактные данные больше не собираются в форме бронирования
  // (см. ENABLE_PARTNER_CONTACT_FORM). Если контакты всё же переданы
  // (например, восстановленной формой) — валидируем их; иначе бронируем
  // без контактов и отправляем туриста дозаполнять данные на сайте партнёра.
  const hasContactInput = Boolean(
    body.name?.trim() || body.email?.trim() || body.phone?.trim()
  );

  let name = "";
  let email = "";
  let phone = "";

  if (hasContactInput) {
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

    ({ name, email, phone } = contact);
  }

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

  let admin: ReturnType<typeof createSupabaseAdminClient> | null = null;
  if (isSupabaseConfigured()) {
    try {
      admin = createSupabaseAdminClient();
    } catch {
      admin = null;
    }
  }

  const experienceMeta = await resolveTripsterExperienceMeta(admin, experienceId);

  const checkoutContext = {
    startDate: date,
    time,
    guests: personsCount,
    name,
    email,
    phone,
    messageToGuide,
    fallbackUrl: experienceMeta.tripsterUrl,
  };

  const fallbackUrl = await buildAffiliateFallbackUrl({
    supabase: admin,
    experienceId,
    slug,
    cityId: excursion?.cityId ?? experienceMeta.cityId,
    tripsterUrl: experienceMeta.tripsterUrl,
    date,
    time,
    personsCount,
    name,
    email,
    phone,
    messageToGuide,
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

  // Без контактов заказ через External Orders создать нельзя — сразу
  // открываем сайт партнёра с датой, временем и числом туристов.
  if (!hasContactInput) {
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
      fallbackReason: "contact_on_partner_site",
      error:
        "Контактные данные заполняются на сайте партнёра — открываем Tripster с выбранной датой, временем и числом туристов.",
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

    const rawOrderUrl = resolveTripsterCheckoutUrl(
      experienceId,
      order.url ?? null,
      checkoutContext,
      order.id
    );
    const orderUrl = await resolveAffiliateOrderUrl(admin, {
      experienceId,
      cityId: excursion?.cityId ?? experienceMeta.cityId,
      orderUrl: rawOrderUrl,
    });

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
      status: order.status ?? "confirmation",
      orderId: order.id,
      orderUrl,
      priceSnapshot: order.price ?? null,
    });

    return NextResponse.json({
      ok: true,
      mode: "tripster_order",
      orderId: order.id,
      status: order.status,
      orderUrl,
      price: order.price,
    });
  } catch (error) {
    if (error instanceof TripsterBookingError) {
      const isInfraError =
        error.status === 401 || error.status === 403 || error.status === 503;

      console.warn("[tripster/booking-request] external_orders failed", {
        status: error.status,
        experienceId,
        slug,
        reason: isInfraError
          ? resolveAffiliateFallbackReason(error.status)
          : "api_booking_rejected",
        details: error.details,
      });

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
