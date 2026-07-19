import { NextResponse } from "next/server";
import { ENABLE_PARTNER_CONTACT_FORM } from "@/lib/booking/partner-contact-form-flag";
import { parseExcursionSlug } from "@/lib/excursion-slug";
import { buildDefaultTickets } from "@/lib/excursion-schedule";
import { fetchExcursionDetailServer } from "@/lib/excursion-server";
import {
  claimPartnerBookingOperation,
  completePartnerBookingOperation,
  fingerprintPartnerBookingRequest,
  isValidBookingOperationKey,
} from "@/lib/partner-booking/idempotency";
import { checkRateLimit, getClientIp, rateLimitErrorResponse } from "@/lib/rate-limit";
import {
  createTripsterExternalOrder,
  TripsterBookingError,
} from "@/lib/tripster/booking-api";
import { isTripsterConfigured } from "@/lib/tripster/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifyGuestFormProtection } from "@/lib/forms/captcha-server";
import { fetchSiteNavigation } from "@/lib/site-settings-server";
import { publicBookingError } from "@/lib/partner-booking/public-errors";

type RouteContext = { params: Promise<{ slug: string }> };

type BookBody = {
  date?: string;
  time?: string;
  personsCount?: number;
  name?: string;
  email?: string;
  phone?: string;
  messageToGuide?: string;
  captchaToken?: string;
  company?: string;
};

function normalizeTimeForApi(time: string): string {
  const normalized = time.trim();
  return normalized.length === 5 ? `${normalized}:00` : normalized;
}

export async function POST(request: Request, context: RouteContext) {
  const limit = await checkRateLimit(
    `excursions:partner-booking:ip:${getClientIp(request)}`,
    5,
    60_000,
  );
  if (!limit.ok) {
    return rateLimitErrorResponse(
      limit.retryAfterSec,
      "Слишком много попыток бронирования. Повторите позже.",
    );
  }

  const body = (await request.json().catch(() => null)) as BookBody | null;
  if (!body) {
    return NextResponse.json(publicBookingError("BOOKING_INVALID_REQUEST"), { status: 400 });
  }

  const protection = await verifyGuestFormProtection({
    request,
    formId: "partner_booking",
    captchaToken: body.captchaToken,
    honeypot: body.company,
  });
  if (!protection.ok) {
    if (protection.kind === "configuration") {
      return NextResponse.json(
        publicBookingError("BOOKING_VERIFICATION_UNAVAILABLE"),
        { status: 503 },
      );
    }
    return NextResponse.json(
      publicBookingError("BOOKING_VERIFICATION_FAILED"),
      { status: 400 },
    );
  }

  if (!(await fetchSiteNavigation()).showExcursions) {
    return NextResponse.json(publicBookingError("BOOKING_SECTION_UNAVAILABLE"), { status: 404 });
  }

  const { slug } = await context.params;
  const excursion = await fetchExcursionDetailServer(slug);
  if (!excursion) {
    return NextResponse.json(publicBookingError("BOOKING_PRODUCT_NOT_FOUND"), { status: 404 });
  }

  const date = body.date?.trim();
  const time = body.time?.trim();
  const personsCount = body.personsCount ?? 1;
  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const messageToGuide = body.messageToGuide?.trim();

  if (!date || !time || personsCount < 1) {
    return NextResponse.json(publicBookingError("BOOKING_REQUIRED_FIELDS"), { status: 400 });
  }

  const hasContactInput = Boolean(name || email || phone);

  if (excursion.partner === "platform") {
    return NextResponse.json(
      publicBookingError("BOOKING_USE_SITE_CHECKOUT"),
      { status: 409 }
    );
  }

  const parsed = parseExcursionSlug(slug);
  const affiliateFallback = (reason: string, status = 200) =>
    NextResponse.json(
      {
        ok: false,
        mode: "affiliate_fallback",
        fallbackUrl: `/api/affiliate/go/${slug}`,
        fallbackReason: reason,
        ...publicBookingError("BOOKING_PARTNER_HANDOFF"),
      },
      { status },
    );

  if (parsed?.partner === "sputnik8" || excursion.partner === "sputnik8") {
    // Sputnik8 is affiliate-only in the product contract. The API route must
    // never turn crafted contact payloads into real partner orders.
    return affiliateFallback("affiliate_only");
  }

  // UI hiding is not a security boundary. Keep the server-side feature guard
  // authoritative so direct requests cannot create real External Orders while
  // partner contact collection is disabled.
  if (!ENABLE_PARTNER_CONTACT_FORM || !hasContactInput) {
    return affiliateFallback("contact_on_partner_site");
  }

  if (!isTripsterConfigured() || !isSupabaseConfigured()) {
    return affiliateFallback("api_not_configured");
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? null;
  if (!isValidBookingOperationKey(idempotencyKey)) {
    return NextResponse.json(
      publicBookingError("BOOKING_REQUEST_KEY_INVALID"),
      { status: 400 },
    );
  }

  const tickets = buildDefaultTickets(excursion.ticketOptions, personsCount);
  const operationKey = idempotencyKey;
  const operationStore = createSupabaseAdminClient();
  const requestFingerprint = fingerprintPartnerBookingRequest({
    experienceId: excursion.id,
    date,
    time: normalizeTimeForApi(time),
    personsCount,
    tickets,
    name,
    email,
    phone,
    messageToGuide: messageToGuide ?? null,
  });
  const claim = await claimPartnerBookingOperation(operationStore, {
    provider: "tripster",
    idempotencyKey: operationKey,
    requestFingerprint,
  });

  if (claim.state === "replay") {
    return NextResponse.json(claim.response.payload, {
      status: claim.response.statusCode,
      headers: { "X-Idempotent-Replay": "true" },
    });
  }
  if (claim.state === "conflict") {
    return NextResponse.json(
      publicBookingError("BOOKING_REQUEST_CONFLICT"),
      { status: 409 },
    );
  }
  if (claim.state === "in_progress") {
    return NextResponse.json(
      publicBookingError("BOOKING_REQUEST_IN_PROGRESS"),
      { status: 409, headers: { "Retry-After": "5" } },
    );
  }
  if (claim.state === "unavailable") {
    return affiliateFallback("idempotency_unavailable");
  }

  async function respond(payload: Record<string, unknown>, statusCode = 200) {
    await completePartnerBookingOperation(operationStore, {
      provider: "tripster",
      idempotencyKey: operationKey,
      response: { payload, statusCode },
    });
    return NextResponse.json(payload, { status: statusCode });
  }

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
      operationKey
    );

    try {
      const session = await createSupabaseServerClient();
      const {
        data: { user },
      } = await session.auth.getUser();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (operationStore as any).from("tripster_booking_requests").insert({
        experience_id: excursion.id,
        experience_slug: excursion.slug,
        user_id: user?.id ?? null,
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

    return respond({
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
        return respond(
          {
            ok: false,
            mode: "affiliate_fallback",
            fallbackUrl: `/api/affiliate/go/${slug}`,
            fallbackReason: "external_orders_unauthorized",
            ...publicBookingError("BOOKING_PARTNER_HANDOFF"),
          },
          error.status,
        );
      }

      return respond(
        {
          ok: false,
          ...publicBookingError("BOOKING_PARTNER_REJECTED"),
        },
        error.status >= 400 && error.status < 600 ? error.status : 400,
      );
    }

    return respond(publicBookingError("BOOKING_SERVICE_UNAVAILABLE"), 502);
  }
}
