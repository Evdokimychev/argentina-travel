import { createHmac, timingSafeEqual } from "crypto";
import { resolveOrganizerParams } from "@/lib/booking-params";
import { absoluteUrl } from "@/lib/site-url";
import type { Booking } from "@/types/tourist";

const MERCADOPAGO_API_BASE = "https://api.mercadopago.com";
const MERCADOPAGO_TIMEOUT_MS = 15000;

type JsonRecord = Record<string, unknown>;

export interface MercadoPagoPreferenceResult {
  preferenceId: string;
  checkoutUrl: string;
  sandboxCheckoutUrl?: string;
}

export interface MercadoPagoNotification {
  topic: string;
  action?: string;
  notificationId?: string;
  dataId?: string;
  liveMode?: boolean;
  rawPayload: JsonRecord;
}

export interface MercadoPagoPaymentDetails {
  id: string;
  status: string;
  statusDetail?: string;
  transactionAmount: number;
  currencyId?: string;
  externalReference?: string;
  metadata: JsonRecord;
  dateCreated?: string;
  dateApproved?: string;
}

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonRecord;
}

function buildAuthHeaders(accessToken: string, idempotencyKey?: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
  };
}

function createTimeoutController(timeoutMs = MERCADOPAGO_TIMEOUT_MS): {
  controller: AbortController;
  timeout: ReturnType<typeof setTimeout>;
} {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeout };
}

export async function createPreference(
  booking: Booking,
  input: {
    accessToken: string;
    notificationUrl?: string;
    baseUrl?: string;
    idempotencyKey?: string;
  }
): Promise<MercadoPagoPreferenceResult> {
  const accessToken = input.accessToken.trim();
  if (!accessToken) {
    throw new Error("Mercado Pago access token is missing.");
  }

  const link = booking.paymentLink;
  const amount = Math.max(0, Number(link?.amountUsd ?? booking.totalPriceUsd));
  const currencyId = resolveOrganizerParams(booking).currency || "ARS";
  const safeAmount = Number(amount.toFixed(2));
  if (!(safeAmount > 0)) {
    throw new Error("Booking amount must be greater than zero to create Mercado Pago preference.");
  }
  const baseUrl = input.baseUrl?.trim().replace(/\/$/, "") || null;
  const toAbsoluteUrl = (path: string) => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (baseUrl) return `${baseUrl}${normalizedPath}`;
    return absoluteUrl(normalizedPath);
  };
  const returnPath = link?.token ? `/booking/pay/${link.token}` : "/profile/bookings";
  const returnUrl = toAbsoluteUrl(returnPath);

  const body = {
    items: [
      {
        id: booking.id,
        title: `Оплата бронирования ${booking.tourTitle}`,
        description: `Бронирование ${booking.id}`,
        quantity: 1,
        currency_id: currencyId,
        unit_price: safeAmount,
      },
    ],
    payer: {
      name: booking.contactName,
      email: booking.contactEmail,
    },
    metadata: {
      bookingId: booking.id,
      paymentLinkToken: link?.token ?? null,
    },
    external_reference: booking.id,
    notification_url: input.notificationUrl ?? toAbsoluteUrl("/api/webhooks/payments/mercadopago"),
    back_urls: {
      success: `${returnUrl}?payment=success`,
      pending: `${returnUrl}?payment=pending`,
      failure: `${returnUrl}?payment=failure`,
    },
    auto_return: "approved" as const,
  };

  const { controller, timeout } = createTimeoutController();
  const response = await fetch(`${MERCADOPAGO_API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: buildAuthHeaders(accessToken, input.idempotencyKey),
    body: JSON.stringify(body),
    signal: controller.signal,
    cache: "no-store",
  }).finally(() => clearTimeout(timeout));

  const payload = (await response.json().catch(() => null)) as
    | {
        id?: string;
        init_point?: string;
        sandbox_init_point?: string;
        message?: string;
        error?: string;
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? payload?.error ?? "Mercado Pago preference request failed.");
  }

  const preferenceId = payload?.id?.trim();
  const checkoutUrl = payload?.init_point?.trim();
  if (!preferenceId || !checkoutUrl) {
    throw new Error("Mercado Pago did not return preference data.");
  }

  return {
    preferenceId,
    checkoutUrl,
    sandboxCheckoutUrl: payload?.sandbox_init_point?.trim() || undefined,
  };
}

function parseSignatureHeader(signatureHeader: string): { ts?: string; v1?: string } {
  const parsed: { ts?: string; v1?: string } = {};
  for (const part of signatureHeader.split(",")) {
    const [rawKey, rawValue] = part.split("=");
    const key = rawKey?.trim().toLowerCase();
    const value = rawValue?.trim();
    if (!key || !value) continue;
    if (key === "ts") parsed.ts = value;
    if (key === "v1") parsed.v1 = value.toLowerCase();
  }
  return parsed;
}

function secureHexCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyWebhookSignature(input: {
  secret: string | null | undefined;
  signatureHeader: string | null | undefined;
  requestIdHeader: string | null | undefined;
  dataId: string | null | undefined;
}): boolean {
  const secret = input.secret?.trim();
  const signatureHeader = input.signatureHeader?.trim();
  if (!secret || !signatureHeader) return false;

  const { ts, v1 } = parseSignatureHeader(signatureHeader);
  if (!ts || !v1) return false;

  const manifestParts: string[] = [];
  const normalizedDataId = input.dataId?.trim().toLowerCase();
  const requestId = input.requestIdHeader?.trim();

  if (normalizedDataId) manifestParts.push(`id:${normalizedDataId}`);
  if (requestId) manifestParts.push(`request-id:${requestId}`);
  manifestParts.push(`ts:${ts}`);

  const manifest = manifestParts.map((part) => `${part};`).join("");
  const digest = createHmac("sha256", secret).update(manifest).digest("hex");
  return secureHexCompare(digest, v1);
}

export function parseNotification(input: {
  payload: unknown;
  query: URLSearchParams;
}): MercadoPagoNotification | null {
  const payloadRecord = asRecord(input.payload);
  if (!payloadRecord) return null;

  const payloadData = asRecord(payloadRecord.data);
  const topic =
    input.query.get("topic")?.trim() ||
    input.query.get("type")?.trim() ||
    (typeof payloadRecord.type === "string" ? payloadRecord.type.trim() : "");

  if (!topic) return null;

  const dataId =
    input.query.get("data.id")?.trim() ||
    (typeof input.query.get("id") === "string" ? input.query.get("id")!.trim() : "") ||
    (typeof payloadData?.id === "string" ? payloadData.id.trim() : "") ||
    (typeof payloadRecord.id === "string" ? payloadRecord.id.trim() : "");

  const action = typeof payloadRecord.action === "string" ? payloadRecord.action.trim() : undefined;
  const notificationId =
    typeof payloadRecord.id === "number"
      ? String(payloadRecord.id)
      : typeof payloadRecord.id === "string"
        ? payloadRecord.id.trim()
        : undefined;
  const liveMode = typeof payloadRecord.live_mode === "boolean" ? payloadRecord.live_mode : undefined;

  return {
    topic: topic.toLowerCase(),
    action,
    notificationId,
    dataId: dataId || undefined,
    liveMode,
    rawPayload: payloadRecord,
  };
}

export async function fetchPaymentDetails(input: {
  paymentId: string;
  accessToken: string;
}): Promise<MercadoPagoPaymentDetails> {
  const paymentId = input.paymentId.trim();
  const accessToken = input.accessToken.trim();
  if (!paymentId) throw new Error("Missing Mercado Pago payment id.");
  if (!accessToken) throw new Error("Mercado Pago access token is missing.");

  const { controller, timeout } = createTimeoutController();
  const response = await fetch(`${MERCADOPAGO_API_BASE}/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: buildAuthHeaders(accessToken),
    signal: controller.signal,
    cache: "no-store",
  }).finally(() => clearTimeout(timeout));

  const payload = (await response.json().catch(() => null)) as
    | {
        id?: number | string;
        status?: string;
        status_detail?: string;
        transaction_amount?: number;
        currency_id?: string;
        external_reference?: string;
        metadata?: JsonRecord;
        date_created?: string;
        date_approved?: string;
        message?: string;
      }
    | null;

  if (!response.ok || !payload) {
    throw new Error(payload?.message ?? "Failed to fetch Mercado Pago payment.");
  }

  const resolvedId =
    typeof payload.id === "number"
      ? String(payload.id)
      : typeof payload.id === "string"
        ? payload.id.trim()
        : paymentId;
  const status = typeof payload.status === "string" ? payload.status.trim() : "";
  if (!status) {
    throw new Error("Mercado Pago payment response misses status.");
  }

  return {
    id: resolvedId,
    status,
    statusDetail: payload.status_detail?.trim() || undefined,
    transactionAmount:
      typeof payload.transaction_amount === "number" && Number.isFinite(payload.transaction_amount)
        ? payload.transaction_amount
        : 0,
    currencyId: payload.currency_id?.trim() || undefined,
    externalReference: payload.external_reference?.trim() || undefined,
    metadata: asRecord(payload.metadata) ?? {},
    dateCreated: payload.date_created?.trim() || undefined,
    dateApproved: payload.date_approved?.trim() || undefined,
  };
}
