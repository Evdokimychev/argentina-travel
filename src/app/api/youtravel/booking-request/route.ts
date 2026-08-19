import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchYouTravelTourDetailServer } from "@/lib/youtravel/partner-tour-server";
import { isYouTravelConfigured } from "@/lib/youtravel/env";
import {
  createYouTravelBookingRequest,
  YouTravelBookingError,
} from "@/lib/youtravel/booking-api";
import {
  fetchYouTravelBookingRequestsForUser,
  insertYouTravelBookingRequest,
} from "@/lib/youtravel/booking-requests-server";
import { buildTripsterBookingContactPayload } from "@/lib/tripster/booking-contact";
import { buildYouTravelAffiliateFallbackPath } from "@/lib/youtravel/partner-tour-utils";
import { parseYouTravelTourSlug } from "@/lib/youtravel/partner-tour-mapper";
import {
  buildYouTravelCheckoutUrl,
  resolveYouTravelBookingRedirectFromApi,
} from "@/lib/youtravel/checkout-url";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";
import {
  claimPartnerBookingOperation,
  completePartnerBookingOperation,
  fingerprintPartnerBookingRequest,
  isValidBookingOperationKey,
} from "@/lib/partner-booking/idempotency";
import { verifyGuestFormProtection } from "@/lib/forms/captcha-server";
import { fetchSiteNavigation } from "@/lib/site-settings-server";
import { publicBookingError } from "@/lib/partner-booking/public-errors";

type BookingRequestBody = {
  slug?: string;
  startDate?: string;
  endDate?: string;
  offerId?: number;
  personsCount?: number;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  userId?: string;
  captchaToken?: string;
  company?: string;
};

function resolveAffiliateFallbackReason(status?: number): string {
  if (status === 401) return "api_unauthorized";
  if (status === 404) return "api_not_found";
  return "api_unavailable";
}

async function persistYouTravelRequest(input: {
  slug: string;
  tourId: number;
  userId: string | null;
  startDate: string;
  endDate: string | null;
  offerId: number | null;
  personsCount: number;
  name: string;
  email: string;
  phone: string;
  message?: string;
  status: string;
  orderId?: string | null;
  orderUrl?: string | null;
  priceSnapshot?: unknown;
}) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createSupabaseAdminClient();
    await insertYouTravelBookingRequest(supabase, {
      tourId: input.tourId,
      tourSlug: input.slug,
      userId: input.userId,
      offerId: input.offerId,
      startDate: input.startDate,
      endDate: input.endDate,
      personsCount: input.personsCount,
      customerName: input.name,
      customerEmail: input.email,
      customerPhone: input.phone,
      message: input.message?.trim() || null,
      youtravelOrderId: input.orderId ?? null,
      youtravelOrderUrl: input.orderUrl ?? null,
      youtravelStatus: input.status,
      priceSnapshot: input.priceSnapshot ?? null,
    });
  } catch {
    // CRM persistence should not break user booking flow.
  }
}

async function postYouTravelBookingRequest(request: Request) {
  const body = (await request.json().catch(() => null)) as BookingRequestBody | null;
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

  if (!(await fetchSiteNavigation()).showTours) {
    return NextResponse.json(publicBookingError("BOOKING_SECTION_UNAVAILABLE"), { status: 404 });
  }

  const slug = body.slug?.trim();
  const startDate = body.startDate?.trim();
  const endDate = body.endDate?.trim() || null;
  const personsCount = body.personsCount ?? 1;
  const message = body.message?.trim();
  const offerId =
    body.offerId != null && Number.isFinite(body.offerId) ? Number(body.offerId) : null;

  if (!slug || !startDate || personsCount < 1) {
    return NextResponse.json(publicBookingError("BOOKING_REQUIRED_FIELDS"), { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const userId = authUser?.id ?? null;
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
  // (см. ENABLE_PARTNER_CONTACT_FORM). Если контакты всё же переданы —
  // валидируем их; иначе бронируем без контактов и отправляем туриста
  // дозаполнять данные на сайте партнёра.
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
      messageToGuide: message,
      profileCountry,
    });

    if ("error" in contact) {
      return NextResponse.json(publicBookingError("BOOKING_CONTACT_INVALID"), { status: 400 });
    }

    ({ name, email, phone } = contact);
  }

  const tourDetail = await fetchYouTravelTourDetailServer(slug);
  const tourId = tourDetail?.partnerExperienceId ?? parseYouTravelTourSlug(slug);

  if (!tourId) {
    return NextResponse.json(publicBookingError("BOOKING_PRODUCT_NOT_FOUND"), { status: 404 });
  }

  const fallbackUrl = buildYouTravelAffiliateFallbackPath({
    slug,
    startDate,
    endDate,
    guests: personsCount,
    name,
    email,
    phone,
    offerId,
  });

  const persistBase = {
    ...body,
    slug,
    tourId,
    userId: authUser?.id ?? userId,
    startDate,
    endDate,
    offerId,
    personsCount,
    name,
    email,
    phone,
    message,
  };

  if (!isYouTravelConfigured()) {
    await persistYouTravelRequest({
      ...persistBase,
      status: "affiliate_fallback",
    });
    return NextResponse.json({
      ok: false,
      mode: "affiliate_fallback",
      fallbackUrl,
      fallbackReason: "api_not_configured",
      ...publicBookingError("BOOKING_PARTNER_HANDOFF"),
    });
  }

  // Без контактов заказ через API создать нельзя — сразу открываем сайт
  // партнёра с выбранной датой и числом туристов.
  if (!hasContactInput) {
    await persistYouTravelRequest({
      ...persistBase,
      status: "affiliate_fallback",
    });
    return NextResponse.json({
      ok: false,
      mode: "affiliate_fallback",
      fallbackUrl,
      fallbackReason: "contact_on_partner_site",
      ...publicBookingError("BOOKING_PARTNER_HANDOFF"),
    });
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? null;
  if (!isValidBookingOperationKey(idempotencyKey)) {
    return NextResponse.json(
      publicBookingError("BOOKING_REQUEST_KEY_INVALID"),
      { status: 400 },
    );
  }
  const operationKey = idempotencyKey;

  let operationStore: ReturnType<typeof createSupabaseAdminClient>;
  try {
    operationStore = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({
      ok: false,
      mode: "affiliate_fallback",
      fallbackUrl,
      fallbackReason: "idempotency_unavailable",
      ...publicBookingError("BOOKING_PARTNER_HANDOFF"),
    });
  }

  const claim = await claimPartnerBookingOperation(operationStore, {
    provider: "youtravel",
    idempotencyKey: operationKey,
    requestFingerprint: fingerprintPartnerBookingRequest({
      tourId,
      offerId,
      startDate,
      endDate,
      personsCount,
      name,
      email,
      phone,
      message: message ?? null,
    }),
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
    return NextResponse.json({
      ok: false,
      mode: "affiliate_fallback",
      fallbackUrl,
      fallbackReason: "idempotency_unavailable",
      ...publicBookingError("BOOKING_PARTNER_HANDOFF"),
    });
  }

  async function respond(payload: Record<string, unknown>, statusCode = 200) {
    await completePartnerBookingOperation(operationStore, {
      provider: "youtravel",
      idempotencyKey: operationKey,
      response: { payload, statusCode },
    });
    return NextResponse.json(payload, { status: statusCode });
  }

  try {
    const order = await createYouTravelBookingRequest({
      tourId,
      offerId,
      startDate,
      endDate,
      personsCount,
      name,
      email,
      phone,
      message,
    });

    const orderId = order.id != null ? String(order.id) : null;
    const orderStatus = order.status?.trim() || "submitted";
    const orderUrl =
      orderId && tourId > 0
        ? buildYouTravelCheckoutUrl(tourId, orderId)
        : order.url?.trim() || null;

    await persistYouTravelRequest({
      ...persistBase,
      status: orderStatus,
      orderId,
      orderUrl,
      priceSnapshot: order.price ?? null,
    });

    const redirectUrl = resolveYouTravelBookingRedirectFromApi({
      response: {
        ok: true,
        mode: "youtravel_order",
        orderId,
        orderUrl,
      },
      tourId,
      fallbackUrl,
    });

    if (redirectUrl) {
      return respond({
        ok: true,
        mode: "youtravel_order",
        orderId,
        status: orderStatus,
        orderUrl: redirectUrl,
        price: order.price,
      });
    }
  } catch (error) {
    if (error instanceof YouTravelBookingError) {
      const isInfraError =
        error.status === 401 || error.status === 404 || error.status === 503;

      await persistYouTravelRequest({
        ...persistBase,
        status: "affiliate_fallback",
        priceSnapshot: error.details,
      });

      return respond(
        {
          ok: false,
          mode: "affiliate_fallback",
          fallbackUrl,
          fallbackReason: isInfraError
            ? resolveAffiliateFallbackReason(error.status)
            : "api_booking_rejected",
          youtravelStatus: error.status,
          ...publicBookingError(
            isInfraError ? "BOOKING_PARTNER_HANDOFF" : "BOOKING_PARTNER_REJECTED",
          ),
        },
        error.status >= 400 && error.status < 600 ? error.status : 502,
      );
    }
  }

  await persistYouTravelRequest({
    ...persistBase,
    status: "affiliate_fallback",
  });

  return respond(
    {
      ok: false,
      mode: "affiliate_fallback",
      fallbackUrl,
      fallbackReason: "api_unavailable",
      ...publicBookingError("BOOKING_PARTNER_HANDOFF"),
    },
    502,
  );
}

export const POST = withRateLimit(postYouTravelBookingRequest, {
  limit: 10,
  window: 60_000,
  keyPrefix: "youtravel-booking:create",
  key: (request) => `ip:${getClientIp(request)}`,
  message: "Слишком много попыток бронирования. Повторите позже.",
  policy: "security_critical",
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
    return NextResponse.json(publicBookingError("BOOKING_AUTH_REQUIRED"), { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const requests = await fetchYouTravelBookingRequestsForUser(admin, {
    userId: authUser.id,
    email: authUser.email,
    limit: 50,
  });

  return NextResponse.json({ requests });
}
