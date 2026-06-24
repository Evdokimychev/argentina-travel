import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { updateYouTravelBookingRequestByOrderId } from "@/lib/youtravel/booking-requests-server";

type WebhookBody = {
  order_id?: string;
  orderId?: string;
  status?: string;
  url?: string;
};

function secureCompare(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left, "utf8");
  const rightBuf = Buffer.from(right, "utf8");
  if (leftBuf.length !== rightBuf.length) return false;
  return timingSafeEqual(leftBuf, rightBuf);
}

function resolveWebhookSecret(request: Request): string | null {
  const headerSecret =
    request.headers.get("x-youtravel-webhook-secret")?.trim() ||
    request.headers.get("x-webhook-secret")?.trim();
  if (headerSecret) return headerSecret;

  try {
    const url = new URL(request.url);
    return url.searchParams.get("secret")?.trim() || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const configuredSecret = process.env.YOUTRAVEL_WEBHOOK_SECRET?.trim();
  if (!configuredSecret) {
    return NextResponse.json(
      { ok: false, error: "YOUTRAVEL_WEBHOOK_SECRET is not configured." },
      { status: 503 }
    );
  }

  const providedSecret = resolveWebhookSecret(request);
  if (!providedSecret || !secureCompare(providedSecret, configuredSecret)) {
    return NextResponse.json({ ok: false, error: "Invalid webhook secret." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as WebhookBody | null;
  const orderId = body?.order_id?.trim() || body?.orderId?.trim() || "";
  const status = body?.status?.trim() || "";
  const orderUrl = body?.url?.trim() || null;

  if (!orderId || !status) {
    return NextResponse.json(
      { ok: false, error: "order_id and status are required." },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, updated: 0, note: "Supabase not configured." });
  }

  const supabase = createSupabaseAdminClient();
  const updated = await updateYouTravelBookingRequestByOrderId(supabase, orderId, {
    status,
    orderUrl: orderUrl ?? undefined,
    statusSyncedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, updated });
}
