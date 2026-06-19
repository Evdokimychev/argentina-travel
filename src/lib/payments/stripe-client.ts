import { createHmac, timingSafeEqual } from "crypto";
import { fetchLiveExchangeRates, resolveRateFromUsd } from "@/lib/exchange-rates";
import {
  convertUsdToDisplayCurrency,
  resolveChargeCurrency,
  type CheckoutCurrencyCode,
} from "@/lib/payments/checkout-currency";
import { absoluteUrl } from "@/lib/site-url";
import type { BookingPaymentStatus } from "@/types/booking-params";
import type {
  MercadoPagoCapturePhase,
  PaymentReceiptMetadata,
} from "@/types/payment-platform";
import type { Booking } from "@/types/tourist";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const STRIPE_TIMEOUT_MS = 15000;

type JsonRecord = Record<string, unknown>;

export interface StripeCheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
}

export interface StripePaymentIntentDetails {
  id: string;
  status: string;
  amount: number;
  amountReceived: number;
  amountCapturable: number;
  currency: string;
  metadata: JsonRecord;
  created?: number;
  canceledAt?: number;
  paymentMethodId?: string;
  latestChargeId?: string;
}

export interface StripeChargeDetails {
  id: string;
  status: string;
  amount: number;
  amountRefunded: number;
  currency: string;
  metadata: JsonRecord;
  created?: number;
  paid: boolean;
  refunded: boolean;
  paymentIntentId?: string;
}

export interface StripeCheckoutSessionDetails {
  id: string;
  status: string;
  paymentStatus: string;
  paymentIntentId?: string;
  amountTotal: number;
  currency: string;
  metadata: JsonRecord;
  clientReferenceId?: string;
  url?: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  created: number;
  livemode: boolean;
  dataObject: JsonRecord;
  rawPayload: JsonRecord;
}

export interface StripeRefundDetails {
  id: string;
  status: string;
  amount: number;
  currency: string;
  paymentIntentId?: string;
  chargeId?: string;
  reason?: string;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function isStripeEnabled(): boolean {
  const flag = process.env.STRIPE_ENABLED?.trim().toLowerCase();
  if (flag === "true") return isStripeConfigured();
  if (flag === "false") return false;
  return isStripeConfigured();
}

export function resolveStripePublishableKey(): string | null {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || null;
}

export function isStripeAvailableOnClient(): boolean {
  const flag = process.env.NEXT_PUBLIC_STRIPE_ENABLED?.trim().toLowerCase();
  if (flag === "true") return Boolean(resolveStripePublishableKey());
  if (flag === "false") return false;
  return Boolean(resolveStripePublishableKey());
}

/** Maps Stripe PaymentIntent / Charge status to platform capture phase. */
export function mapStripeCapturePhase(input: {
  status: string;
  amountRefunded?: number;
  amount?: number;
  refunded?: boolean;
}): MercadoPagoCapturePhase {
  const normalized = input.status.trim().toLowerCase();

  if (input.refunded || normalized === "refunded") return "refunded";
  if (
    typeof input.amountRefunded === "number" &&
    typeof input.amount === "number" &&
    input.amountRefunded > 0
  ) {
    return input.amountRefunded >= input.amount ? "refunded" : "captured";
  }

  if (normalized === "succeeded" || normalized === "paid") return "captured";
  if (normalized === "requires_capture") return "authorized";
  if (normalized === "canceled" || normalized === "failed") return "failed";

  if (
    normalized === "processing" ||
    normalized === "requires_payment_method" ||
    normalized === "requires_confirmation" ||
    normalized === "requires_action" ||
    normalized === "pending"
  ) {
    return "pending";
  }

  return "pending";
}

export function mapStripeToBookingPaymentStatus(input: {
  status: string;
  amount?: number;
  amountReceived?: number;
  amountRefunded?: number;
  refunded?: boolean;
}): BookingPaymentStatus {
  const phase = mapStripeCapturePhase({
    status: input.status,
    amount: input.amount,
    amountRefunded: input.amountRefunded,
    refunded: input.refunded,
  });

  if (phase === "captured") {
    const amount = input.amount ?? 0;
    const received = input.amountReceived ?? amount;
    const refunded = input.amountRefunded ?? 0;
    if (refunded > 0 && refunded < amount) return "partial";
    if (received > 0 && amount > 0 && received < amount) return "partial";
    return "paid";
  }

  if (phase === "refunded") return "refunded";
  return "pending";
}

function centsToMajor(amountCents: number): number {
  return Math.max(0, Number((amountCents / 100).toFixed(2)));
}

function majorToCents(amountUsd: number): number {
  return Math.max(0, Math.round(amountUsd * 100));
}

function stripeTimestampToIso(unixSeconds?: number): string | undefined {
  if (typeof unixSeconds !== "number" || !Number.isFinite(unixSeconds)) return undefined;
  return new Date(unixSeconds * 1000).toISOString();
}

export function buildStripePaymentIntentReceiptMetadata(
  payment: StripePaymentIntentDetails
): PaymentReceiptMetadata {
  return {
    providerStatus: payment.status,
    capturePhase: mapStripeCapturePhase({
      status: payment.status,
      amount: payment.amount,
    }),
    dateCreated: stripeTimestampToIso(payment.created),
    dateApproved:
      payment.status === "succeeded" ? stripeTimestampToIso(payment.created) : undefined,
    paymentMethodId: payment.paymentMethodId,
    providerPaymentId: payment.id,
  };
}

export function buildStripeChargeReceiptMetadata(charge: StripeChargeDetails): PaymentReceiptMetadata {
  return {
    providerStatus: charge.status,
    capturePhase: mapStripeCapturePhase({
      status: charge.status,
      amount: charge.amount,
      amountRefunded: charge.amountRefunded,
      refunded: charge.refunded,
    }),
    dateCreated: stripeTimestampToIso(charge.created),
    dateApproved: charge.paid ? stripeTimestampToIso(charge.created) : undefined,
    providerPaymentId: charge.paymentIntentId ?? charge.id,
  };
}

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonRecord;
}

function buildAuthHeaders(secretKey: string, idempotencyKey?: string): HeadersInit {
  return {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
    ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
  };
}

function createTimeoutController(timeoutMs = STRIPE_TIMEOUT_MS): {
  controller: AbortController;
  timeout: ReturnType<typeof setTimeout>;
} {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeout };
}

function appendFormField(
  params: URLSearchParams,
  key: string,
  value: string | number | boolean | null | undefined
): void {
  if (value === null || value === undefined) return;
  params.append(key, String(value));
}

function resolveBookingIdFromMetadata(metadata: JsonRecord, clientReferenceId?: string): string | null {
  const fromReference = clientReferenceId?.trim();
  if (fromReference) return fromReference;

  const candidates = [metadata.bookingId, metadata.booking_id, metadata.booking];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

export async function createCheckoutSession(
  booking: Booking,
  input: {
    secretKey: string;
    baseUrl?: string;
    idempotencyKey?: string;
  }
): Promise<StripeCheckoutSessionResult> {
  const secretKey = input.secretKey.trim();
  if (!secretKey) {
    throw new Error("Stripe secret key is missing.");
  }

  const link = booking.paymentLink;
  const amountUsd = Math.max(0, Number(link?.amountUsd ?? booking.totalPriceUsd));
  const displayCurrency: CheckoutCurrencyCode = booking.metadata?.checkoutCurrency ?? "USD";
  const chargeCurrency = resolveChargeCurrency("stripe", displayCurrency);
  const ratesPayload = await fetchLiveExchangeRates();
  const chargeAmount =
    chargeCurrency === "USD"
      ? amountUsd
      : convertUsdToDisplayCurrency(amountUsd, chargeCurrency, ratesPayload.rates);
  const safeAmount = Number(chargeAmount.toFixed(2));
  if (!(safeAmount > 0)) {
    throw new Error("Booking amount must be greater than zero to create Stripe checkout session.");
  }
  const stripeCurrency = chargeCurrency.toLowerCase();

  const baseUrl = input.baseUrl?.trim().replace(/\/$/, "") || null;
  const toAbsoluteUrl = (path: string) => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (baseUrl) return `${baseUrl}${normalizedPath}`;
    return absoluteUrl(normalizedPath);
  };

  const returnPath = link?.token ? `/booking/pay/${link.token}` : "/profile/bookings";
  const resultBase = link?.token ? `${returnPath}/result` : returnPath;
  const successUrl = `${toAbsoluteUrl(resultBase)}?status=success`;
  const cancelUrl = `${toAbsoluteUrl(returnPath)}?status=failure`;

  const params = new URLSearchParams();
  appendFormField(params, "mode", "payment");
  appendFormField(params, "success_url", successUrl);
  appendFormField(params, "cancel_url", cancelUrl);
  appendFormField(params, "client_reference_id", booking.id);
  appendFormField(params, "customer_email", booking.contactEmail);
  appendFormField(params, "metadata[bookingId]", booking.id);
  appendFormField(params, "metadata[paymentLinkToken]", link?.token ?? "");
  appendFormField(params, "metadata[displayCurrency]", displayCurrency);
  appendFormField(params, "metadata[amountUsd]", String(amountUsd));
  appendFormField(
    params,
    "metadata[rateFromUsd]",
    String(resolveRateFromUsd(chargeCurrency, ratesPayload.rates))
  );
  appendFormField(params, "payment_intent_data[metadata][bookingId]", booking.id);
  appendFormField(params, "payment_intent_data[metadata][paymentLinkToken]", link?.token ?? "");
  appendFormField(params, "line_items[0][quantity]", 1);
  appendFormField(params, "line_items[0][price_data][currency]", stripeCurrency);
  appendFormField(params, "line_items[0][price_data][unit_amount]", majorToCents(safeAmount));
  appendFormField(
    params,
    "line_items[0][price_data][product_data][name]",
    `Оплата бронирования ${booking.tourTitle}`
  );
  appendFormField(
    params,
    "line_items[0][price_data][product_data][description]",
    `Бронирование ${booking.id}`
  );

  const { controller, timeout } = createTimeoutController();
  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: "POST",
    headers: buildAuthHeaders(secretKey, input.idempotencyKey),
    body: params.toString(),
    signal: controller.signal,
    cache: "no-store",
  }).finally(() => clearTimeout(timeout));

  const payload = (await response.json().catch(() => null)) as
    | { id?: string; url?: string; error?: { message?: string } }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Stripe checkout session request failed.");
  }

  const sessionId = payload?.id?.trim();
  const checkoutUrl = payload?.url?.trim();
  if (!sessionId || !checkoutUrl) {
    throw new Error("Stripe did not return checkout session data.");
  }

  return { sessionId, checkoutUrl };
}

function parsePaymentIntentPayload(payload: JsonRecord, fallbackId: string): StripePaymentIntentDetails {
  const id = typeof payload.id === "string" ? payload.id.trim() : fallbackId;
  const status = typeof payload.status === "string" ? payload.status.trim() : "";
  if (!status) throw new Error("Stripe PaymentIntent response misses status.");

  const latestCharge = payload.latest_charge;
  const latestChargeId =
    typeof latestCharge === "string"
      ? latestCharge.trim()
      : typeof latestCharge === "object" &&
          latestCharge &&
          typeof (latestCharge as JsonRecord).id === "string"
        ? ((latestCharge as JsonRecord).id as string).trim()
        : undefined;

  return {
    id,
    status,
    amount: typeof payload.amount === "number" ? payload.amount : 0,
    amountReceived: typeof payload.amount_received === "number" ? payload.amount_received : 0,
    amountCapturable: typeof payload.amount_capturable === "number" ? payload.amount_capturable : 0,
    currency: typeof payload.currency === "string" ? payload.currency.trim().toUpperCase() : "USD",
    metadata: asRecord(payload.metadata) ?? {},
    created: typeof payload.created === "number" ? payload.created : undefined,
    canceledAt: typeof payload.canceled_at === "number" ? payload.canceled_at : undefined,
    paymentMethodId:
      typeof payload.payment_method === "string"
        ? payload.payment_method.trim()
        : undefined,
    latestChargeId,
  };
}

function parseChargePayload(payload: JsonRecord, fallbackId: string): StripeChargeDetails {
  const id = typeof payload.id === "string" ? payload.id.trim() : fallbackId;
  const status = typeof payload.status === "string" ? payload.status.trim() : "";
  if (!status) throw new Error("Stripe Charge response misses status.");

  const paymentIntent = payload.payment_intent;
  const paymentIntentId =
    typeof paymentIntent === "string"
      ? paymentIntent.trim()
      : typeof paymentIntent === "object" &&
          paymentIntent &&
          typeof (paymentIntent as JsonRecord).id === "string"
        ? ((paymentIntent as JsonRecord).id as string).trim()
        : undefined;

  return {
    id,
    status,
    amount: typeof payload.amount === "number" ? payload.amount : 0,
    amountRefunded: typeof payload.amount_refunded === "number" ? payload.amount_refunded : 0,
    currency: typeof payload.currency === "string" ? payload.currency.trim().toUpperCase() : "USD",
    metadata: asRecord(payload.metadata) ?? {},
    created: typeof payload.created === "number" ? payload.created : undefined,
    paid: payload.paid === true,
    refunded: payload.refunded === true,
    paymentIntentId,
  };
}

export async function fetchPaymentIntent(input: {
  paymentIntentId: string;
  secretKey: string;
}): Promise<StripePaymentIntentDetails> {
  const paymentIntentId = input.paymentIntentId.trim();
  const secretKey = input.secretKey.trim();
  if (!paymentIntentId) throw new Error("Missing Stripe PaymentIntent id.");
  if (!secretKey) throw new Error("Stripe secret key is missing.");

  const { controller, timeout } = createTimeoutController();
  const response = await fetch(
    `${STRIPE_API_BASE}/payment_intents/${encodeURIComponent(paymentIntentId)}`,
    {
      method: "GET",
      headers: buildAuthHeaders(secretKey),
      signal: controller.signal,
      cache: "no-store",
    }
  ).finally(() => clearTimeout(timeout));

  const payload = (await response.json().catch(() => null)) as JsonRecord | null;
  if (!response.ok || !payload) {
    const message =
      payload && typeof payload.error === "object" && payload.error !== null
        ? String((payload.error as JsonRecord).message ?? "Failed to fetch Stripe PaymentIntent.")
        : "Failed to fetch Stripe PaymentIntent.";
    throw new Error(message);
  }

  return parsePaymentIntentPayload(payload, paymentIntentId);
}

export async function fetchCharge(input: {
  chargeId: string;
  secretKey: string;
}): Promise<StripeChargeDetails> {
  const chargeId = input.chargeId.trim();
  const secretKey = input.secretKey.trim();
  if (!chargeId) throw new Error("Missing Stripe Charge id.");
  if (!secretKey) throw new Error("Stripe secret key is missing.");

  const { controller, timeout } = createTimeoutController();
  const response = await fetch(`${STRIPE_API_BASE}/charges/${encodeURIComponent(chargeId)}`, {
    method: "GET",
    headers: buildAuthHeaders(secretKey),
    signal: controller.signal,
    cache: "no-store",
  }).finally(() => clearTimeout(timeout));

  const payload = (await response.json().catch(() => null)) as JsonRecord | null;
  if (!response.ok || !payload) {
    const message =
      payload && typeof payload.error === "object" && payload.error !== null
        ? String((payload.error as JsonRecord).message ?? "Failed to fetch Stripe Charge.")
        : "Failed to fetch Stripe Charge.";
    throw new Error(message);
  }

  return parseChargePayload(payload, chargeId);
}

export async function createStripeRefund(input: {
  secretKey: string;
  paymentIntentId?: string;
  chargeId?: string;
  amount?: number;
  reason?: "requested_by_customer" | "duplicate" | "fraudulent";
}): Promise<StripeRefundDetails> {
  const secretKey = input.secretKey.trim();
  if (!secretKey) throw new Error("Stripe secret key is missing.");

  const paymentIntentId = input.paymentIntentId?.trim();
  const chargeId = input.chargeId?.trim();
  if (!paymentIntentId && !chargeId) {
    throw new Error("Missing Stripe charge or payment intent id.");
  }

  const params = new URLSearchParams();
  if (paymentIntentId) appendFormField(params, "payment_intent", paymentIntentId);
  if (chargeId) appendFormField(params, "charge", chargeId);

  if (typeof input.amount === "number" && Number.isFinite(input.amount) && input.amount > 0) {
    appendFormField(params, "amount", majorToCents(input.amount));
  }
  if (input.reason) appendFormField(params, "reason", input.reason);

  const { controller, timeout } = createTimeoutController();
  const response = await fetch(`${STRIPE_API_BASE}/refunds`, {
    method: "POST",
    headers: buildAuthHeaders(secretKey, `refund-${paymentIntentId ?? chargeId}-${Date.now()}`),
    body: params.toString(),
    signal: controller.signal,
    cache: "no-store",
  }).finally(() => clearTimeout(timeout));

  const payload = (await response.json().catch(() => null)) as JsonRecord | null;
  if (!response.ok || !payload) {
    const message =
      payload && typeof payload.error === "object" && payload.error !== null
        ? String((payload.error as JsonRecord).message ?? "Failed to create Stripe refund.")
        : "Failed to create Stripe refund.";
    throw new Error(message);
  }

  const id = typeof payload.id === "string" ? payload.id.trim() : "";
  const status = typeof payload.status === "string" ? payload.status.trim() : "";
  if (!id || !status) {
    throw new Error("Stripe refund response misses mandatory fields.");
  }

  const paymentIntentFromPayload =
    typeof payload.payment_intent === "string"
      ? payload.payment_intent.trim()
      : undefined;
  const chargeFromPayload = typeof payload.charge === "string" ? payload.charge.trim() : undefined;

  return {
    id,
    status,
    amount: typeof payload.amount === "number" ? centsToMajor(payload.amount) : 0,
    currency:
      typeof payload.currency === "string" ? payload.currency.trim().toUpperCase() : "USD",
    paymentIntentId: paymentIntentFromPayload || paymentIntentId,
    chargeId: chargeFromPayload || chargeId,
    reason: typeof payload.reason === "string" ? payload.reason.trim() : undefined,
  };
}

export async function fetchCheckoutSession(input: {
  sessionId: string;
  secretKey: string;
}): Promise<StripeCheckoutSessionDetails> {
  const sessionId = input.sessionId.trim();
  const secretKey = input.secretKey.trim();
  if (!sessionId) throw new Error("Missing Stripe Checkout Session id.");
  if (!secretKey) throw new Error("Stripe secret key is missing.");

  const { controller, timeout } = createTimeoutController();
  const response = await fetch(
    `${STRIPE_API_BASE}/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      method: "GET",
      headers: buildAuthHeaders(secretKey),
      signal: controller.signal,
      cache: "no-store",
    }
  ).finally(() => clearTimeout(timeout));

  const payload = (await response.json().catch(() => null)) as JsonRecord | null;
  if (!response.ok || !payload) {
    const message =
      payload && typeof payload.error === "object" && payload.error !== null
        ? String((payload.error as JsonRecord).message ?? "Failed to fetch Stripe Checkout Session.")
        : "Failed to fetch Stripe Checkout Session.";
    throw new Error(message);
  }

  const paymentIntent = payload.payment_intent;
  const paymentIntentId =
    typeof paymentIntent === "string"
      ? paymentIntent.trim()
      : typeof paymentIntent === "object" &&
          paymentIntent &&
          typeof (paymentIntent as JsonRecord).id === "string"
        ? ((paymentIntent as JsonRecord).id as string).trim()
        : undefined;

  return {
    id: typeof payload.id === "string" ? payload.id.trim() : sessionId,
    status: typeof payload.status === "string" ? payload.status.trim() : "",
    paymentStatus: typeof payload.payment_status === "string" ? payload.payment_status.trim() : "",
    paymentIntentId,
    amountTotal: typeof payload.amount_total === "number" ? payload.amount_total : 0,
    currency: typeof payload.currency === "string" ? payload.currency.trim().toUpperCase() : "USD",
    metadata: asRecord(payload.metadata) ?? {},
    clientReferenceId:
      typeof payload.client_reference_id === "string"
        ? payload.client_reference_id.trim()
        : undefined,
    url: typeof payload.url === "string" ? payload.url.trim() : undefined,
  };
}

function secureHexCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function parseStripeSignatureHeader(signatureHeader: string): { timestamp?: string; signatures: string[] } {
  const parsed: { timestamp?: string; signatures: string[] } = { signatures: [] };
  for (const part of signatureHeader.split(",")) {
    const [rawKey, rawValue] = part.split("=");
    const key = rawKey?.trim();
    const value = rawValue?.trim();
    if (!key || !value) continue;
    if (key === "t") parsed.timestamp = value;
    if (key === "v1") parsed.signatures.push(value.toLowerCase());
  }
  return parsed;
}

export function verifyStripeWebhookSignature(input: {
  secret: string | null | undefined;
  signatureHeader: string | null | undefined;
  rawBody: string;
  toleranceSeconds?: number;
}): boolean {
  const secret = input.secret?.trim();
  const signatureHeader = input.signatureHeader?.trim();
  if (!secret || !signatureHeader) return false;

  const { timestamp, signatures } = parseStripeSignatureHeader(signatureHeader);
  if (!timestamp || signatures.length === 0) return false;

  const tolerance = input.toleranceSeconds ?? 300;
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) return false;
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampNumber);
  if (ageSeconds > tolerance) return false;

  const signedPayload = `${timestamp}.${input.rawBody}`;
  const digest = createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  return signatures.some((signature) => secureHexCompare(digest, signature));
}

export function parseStripeWebhookPayload(payload: unknown): StripeWebhookEvent | null {
  const record = asRecord(payload);
  if (!record) return null;

  const type = typeof record.type === "string" ? record.type.trim() : "";
  const id = typeof record.id === "string" ? record.id.trim() : "";
  if (!type || !id) return null;

  const data = asRecord(record.data);
  const dataObject = asRecord(data?.object);
  if (!dataObject) return null;

  return {
    id,
    type,
    created: typeof record.created === "number" ? record.created : Math.floor(Date.now() / 1000),
    livemode: record.livemode === true,
    dataObject,
    rawPayload: record,
  };
}

export function resolveStripeBookingId(input: {
  metadata?: JsonRecord;
  clientReferenceId?: string;
}): string | null {
  return resolveBookingIdFromMetadata(input.metadata ?? {}, input.clientReferenceId);
}

export function stripeAmountToUsd(amountCents: number): number {
  return centsToMajor(amountCents);
}
