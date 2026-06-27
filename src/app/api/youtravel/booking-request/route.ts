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
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const slug = body.slug?.trim();
  const startDate = body.startDate?.trim();
  const endDate = body.endDate?.trim() || null;
  const personsCount = body.personsCount ?? 1;
  const message = body.message?.trim();
  const offerId =
    body.offerId != null && Number.isFinite(body.offerId) ? Number(body.offerId) : null;

  if (!slug || !startDate || personsCount < 1) {
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
      return NextResponse.json({ error: contact.error }, { status: 400 });
    }

    ({ name, email, phone } = contact);
  }

  const tourDetail = await fetchYouTravelTourDetailServer(slug);
  const tourId = tourDetail?.partnerExperienceId ?? parseYouTravelTourSlug(slug);

  if (!tourId) {
    return NextResponse.json({ error: "YouTravel tour not found." }, { status: 404 });
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
      error:
        "Сервис бронирования YouTravel.me сейчас недоступен — переходим на сайт партнёра с выбранной датой и числом туристов.",
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
      error:
        "Контактные данные заполняются на сайте партнёра — открываем YouTravel.me с выбранной датой и числом туристов.",
    });
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
      return NextResponse.json({
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

      return NextResponse.json({
        ok: false,
        mode: "affiliate_fallback",
        fallbackUrl,
        fallbackReason: isInfraError
          ? resolveAffiliateFallbackReason(error.status)
          : "api_booking_rejected",
        youtravelStatus: error.status,
        error: isInfraError
          ? "Автоматическое бронирование через API YouTravel.me недоступно — переходим на сайт партнёра с выбранной датой и числом туристов."
          : "Не удалось создать заказ через API YouTravel.me — переходим на сайт партнёра с заполненными данными.",
      });
    }
  }

  await persistYouTravelRequest({
    ...persistBase,
    status: "affiliate_fallback",
  });

  return NextResponse.json({
    ok: false,
    mode: "affiliate_fallback",
    fallbackUrl,
    fallbackReason: "api_unavailable",
    error:
      "Сервис бронирования YouTravel.me временно недоступен — переходим на сайт партнёра с выбранной датой и числом туристов.",
  });
}

export const POST = withRateLimit(postYouTravelBookingRequest, {
  limit: 10,
  window: 60_000,
  keyPrefix: "youtravel-booking:create",
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
  const requests = await fetchYouTravelBookingRequestsForUser(admin, {
    userId: authUser.id,
    email: authUser.email,
    limit: 50,
  });

  return NextResponse.json({ requests });
}
