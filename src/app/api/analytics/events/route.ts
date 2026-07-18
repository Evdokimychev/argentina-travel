import { NextResponse } from "next/server";
import { logAnalyticsEvent } from "@/lib/analytics/events-server";
import { sanitizeAnalyticsParams } from "@/lib/analytics/event-contract";
import { checkRateLimit, getClientIp, rateLimitErrorResponse } from "@/lib/rate-limit";

const EVENT_ID = /^e-[a-z0-9-]{8,96}$/i;
const SESSION_ID = /^s-[a-z0-9-]{8,96}$/i;
const SLUG = /^[a-z0-9][a-z0-9-]{0,119}$/;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8_192) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  const ip = getClientIp(request);
  const limit = await checkRateLimit(`analytics-event:ip:${ip}`, 120, 60_000);
  if (!limit.ok) return rateLimitErrorResponse(limit.retryAfterSec, "Слишком много событий");

  const body = (await request.json().catch(() => null)) as {
    eventType?: string;
    eventId?: string;
    sessionId?: string;
    tourSlug?: string;
    tourId?: string;
    metadata?: Record<string, unknown>;
  } | null;
  if (!body || body.eventType !== "tour_view" || !EVENT_ID.test(body.eventId ?? "")) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }
  const sessionId = SESSION_ID.test(body.sessionId ?? "") ? body.sessionId : null;
  const tourSlug = SLUG.test(body.tourSlug ?? "") ? body.tourSlug : null;
  const tourId = typeof body.tourId === "string" && body.tourId.length <= 120 ? body.tourId : null;
  const metadata = sanitizeAnalyticsParams(body.metadata ?? {});
  await logAnalyticsEvent({
    eventType: "tour_view",
    eventId: body.eventId,
    sessionId,
    tourSlug,
    tourId,
    metadata,
  });
  return new NextResponse(null, { status: 202 });
}
