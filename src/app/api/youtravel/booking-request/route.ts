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

  const { name, email, phone } = contact;

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

    await persistYouTravelRequest({
      ...persistBase,
      status: orderStatus,
      orderId,
      orderUrl: order.url ?? null,
      priceSnapshot: order.price ?? null,
    });

    if (order.url) {
      return NextResponse.json({
        ok: true,
        mode: "youtravel_order",
        orderId,
        status: orderStatus,
        orderUrl: order.url,
        price: order.price,
      });
    }
  } catch (error) {
    if (error instanceof YouTravelBookingError) {
      if (error.status === 401 || error.status === 404 || error.status === 503) {
        await persistYouTravelRequest({
          ...persistBase,
          status: "affiliate_fallback",
          priceSnapshot: error.details,
        });
        return NextResponse.json({
          ok: false,
          mode: "affiliate_fallback",
          fallbackUrl,
          fallbackReason: resolveAffiliateFallbackReason(error.status),
          youtravelStatus: error.status,
          error:
            "Автоматическое бронирование через API YouTravel.me недоступно — переходим на сайт партнёра с выбранной датой и числом туристов.",
        });
      }

      await persistYouTravelRequest({
        ...persistBase,
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
