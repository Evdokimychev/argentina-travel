import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";
import {
  PARTNER_WEBHOOK_EVENTS,
  type PartnerWebhookDeliveryRecord,
  type PartnerWebhookDeliveryStatus,
  type PartnerWebhookEvent,
  type PartnerWebhookRecord,
} from "@/types/partner-webhook";
import type { Booking } from "@/types/tourist";

const MAX_DELIVERY_ATTEMPTS = 3;
const DELIVERY_BASE_BACKOFF_MS = 500;

type DbClient = SupabaseClient<Database>;
type PartnerWebhookRow = Database["public"]["Tables"]["partner_webhooks"]["Row"];
type PartnerWebhookDeliveryRow = Database["public"]["Tables"]["partner_webhook_deliveries"]["Row"];

const PARTNER_WEBHOOK_EVENT_SET = new Set<string>(PARTNER_WEBHOOK_EVENTS);

function waitMs(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toEventSet(events: readonly PartnerWebhookEvent[]): Set<PartnerWebhookEvent> {
  return new Set<PartnerWebhookEvent>(events);
}

export function normalizePartnerWebhookEvents(input: unknown): PartnerWebhookEvent[] {
  if (!Array.isArray(input)) {
    return [...PARTNER_WEBHOOK_EVENTS];
  }

  const eventSet = new Set<PartnerWebhookEvent>();
  for (const item of input) {
    if (typeof item !== "string") continue;
    const normalized = item.trim();
    if (!PARTNER_WEBHOOK_EVENT_SET.has(normalized)) continue;
    eventSet.add(normalized as PartnerWebhookEvent);
  }

  if (eventSet.size === 0) {
    return [...PARTNER_WEBHOOK_EVENTS];
  }
  return Array.from(eventSet);
}

export function resolvePartnerWebhookEventByStatus(status: string): PartnerWebhookEvent | null {
  if (status === "confirmed") return "booking.confirmed";
  if (status === "cancelled") return "booking.cancelled";
  return null;
}

export function validatePartnerWebhookUrl(raw: string): { ok: true; url: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Укажите URL вебхука" };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, error: "Разрешены только URL с протоколом https/http" };
    }
    return { ok: true, url: parsed.toString() };
  } catch {
    return { ok: false, error: "Некорректный URL вебхука" };
  }
}

function maskSecret(secret: string): string {
  const trimmed = secret.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 6) return "******";
  return `${trimmed.slice(0, 3)}***${trimmed.slice(-2)}`;
}

function parseDeliveryPayload(payload: Json): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }
  return payload as Record<string, unknown>;
}

function mapWebhookRow(row: PartnerWebhookRow): PartnerWebhookRecord {
  return {
    id: row.id,
    organizerId: row.organizer_id,
    url: row.url,
    events: normalizePartnerWebhookEvents(row.events),
    active: row.active,
    secretMasked: maskSecret(row.secret),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDeliveryRow(row: PartnerWebhookDeliveryRow): PartnerWebhookDeliveryRecord {
  return {
    id: row.id,
    webhookId: row.webhook_id,
    event: row.event as PartnerWebhookEvent,
    payload: parseDeliveryPayload(row.payload),
    status: row.status as PartnerWebhookDeliveryStatus,
    attempts: row.attempts,
    lastResponseStatus: row.last_response_status,
    lastError: row.last_error,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildWebhookSignature(payloadRaw: string, secret: string): string {
  const digest = createHmac("sha256", secret).update(payloadRaw).digest("hex");
  return `sha256=${digest}`;
}

function truncateMessage(message: string, max = 500): string {
  if (message.length <= max) return message;
  return `${message.slice(0, max)}...`;
}

type DeliveryEnvelope = {
  id: string;
  event: PartnerWebhookEvent;
  occurredAt: string;
  source: "booking" | "test";
  booking: {
    id: string;
    status: string;
    tourSlug: string;
    tourTitle: string;
    organizerId: string;
    contactEmail: string;
    guests: number;
    startDate: string | null;
    endDate: string | null;
    totalPriceUsd: number;
  };
};

function buildDeliveryEnvelope(input: {
  event: PartnerWebhookEvent;
  booking: Booking;
  organizerId: string;
  source: "booking" | "test";
}): DeliveryEnvelope {
  return {
    id: randomUUID(),
    event: input.event,
    occurredAt: new Date().toISOString(),
    source: input.source,
    booking: {
      id: input.booking.id,
      status: input.booking.status,
      tourSlug: input.booking.tourSlug,
      tourTitle: input.booking.tourTitle,
      organizerId: input.organizerId,
      contactEmail: input.booking.contactEmail,
      guests: input.booking.guests,
      startDate: input.booking.startDate ?? null,
      endDate: input.booking.endDate ?? null,
      totalPriceUsd: input.booking.totalPriceUsd,
    },
  };
}

async function insertDeliveryRecord(input: {
  supabase: DbClient;
  webhookId: string;
  event: PartnerWebhookEvent;
  payload: DeliveryEnvelope;
}) {
  const { data, error } = await input.supabase
    .from("partner_webhook_deliveries")
    .insert({
      webhook_id: input.webhookId,
      event: input.event,
      payload: input.payload as unknown as Json,
      status: "pending",
      attempts: 0,
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return data;
}

async function deliverWithRetry(input: {
  supabase: DbClient;
  deliveryId: string;
  webhook: PartnerWebhookRow;
  event: PartnerWebhookEvent;
  payload: DeliveryEnvelope;
}): Promise<PartnerWebhookDeliveryRecord | null> {
  const targetUrl = input.webhook.url.trim();
  if (!targetUrl) {
    await input.supabase
      .from("partner_webhook_deliveries")
      .update({
        status: "failed",
        attempts: 0,
        last_error: "URL вебхука не задан",
      })
      .eq("id", input.deliveryId);
    return null;
  }

  const payloadRaw = JSON.stringify(input.payload);
  const signature = buildWebhookSignature(payloadRaw, input.webhook.secret);
  const headers = {
    "Content-Type": "application/json",
    "X-PVA-Event": input.event,
    "X-PVA-Signature": signature,
    "X-PVA-Webhook-Id": input.webhook.id,
    "X-PVA-Delivery-Id": input.deliveryId,
  };

  let lastError = "Не удалось доставить вебхук";
  let lastResponseStatus: number | null = null;

  for (let attempt = 1; attempt <= MAX_DELIVERY_ATTEMPTS; attempt += 1) {
    await input.supabase
      .from("partner_webhook_deliveries")
      .update({
        status: "delivering",
        attempts: attempt,
      })
      .eq("id", input.deliveryId);

    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: payloadRaw,
        cache: "no-store",
      });

      if (response.ok) {
        const deliveredAt = new Date().toISOString();
        const { data } = await input.supabase
          .from("partner_webhook_deliveries")
          .update({
            status: "delivered",
            attempts: attempt,
            last_error: null,
            last_response_status: response.status,
            delivered_at: deliveredAt,
          })
          .eq("id", input.deliveryId)
          .select("*")
          .single();

        return data ? mapDeliveryRow(data) : null;
      }

      lastResponseStatus = response.status;
      const responseBody = truncateMessage(await response.text().catch(() => ""));
      lastError =
        responseBody.length > 0
          ? `HTTP ${response.status}: ${responseBody}`
          : `HTTP ${response.status}: пустой ответ`;
    } catch (error) {
      lastResponseStatus = null;
      lastError = error instanceof Error ? truncateMessage(error.message) : "Ошибка сети";
    }

    if (attempt < MAX_DELIVERY_ATTEMPTS) {
      const delayMs = DELIVERY_BASE_BACKOFF_MS * 2 ** (attempt - 1);
      await waitMs(delayMs);
    }
  }

  const { data } = await input.supabase
    .from("partner_webhook_deliveries")
    .update({
      status: "failed",
      attempts: MAX_DELIVERY_ATTEMPTS,
      last_error: lastError,
      last_response_status: lastResponseStatus,
    })
    .eq("id", input.deliveryId)
    .select("*")
    .single();

  return data ? mapDeliveryRow(data) : null;
}

export async function listOrganizerPartnerWebhooks(
  supabase: DbClient,
  organizerId: string
): Promise<PartnerWebhookRecord[]> {
  const { data } = await supabase
    .from("partner_webhooks")
    .select("*")
    .eq("organizer_id", organizerId)
    .order("created_at", { ascending: false });

  return (data ?? []).map(mapWebhookRow);
}

export async function getOrganizerPartnerWebhookById(
  supabase: DbClient,
  organizerId: string,
  webhookId: string
): Promise<PartnerWebhookRow | null> {
  const { data, error } = await supabase
    .from("partner_webhooks")
    .select("*")
    .eq("id", webhookId)
    .eq("organizer_id", organizerId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function createOrganizerPartnerWebhook(input: {
  supabase: DbClient;
  organizerId: string;
  url: string;
  secret: string;
  events: PartnerWebhookEvent[];
  active: boolean;
}): Promise<{ webhook: PartnerWebhookRecord } | { error: string }> {
  const parsedUrl = validatePartnerWebhookUrl(input.url);
  if (!parsedUrl.ok) return { error: parsedUrl.error };

  const secret = input.secret.trim();
  if (!secret) return { error: "Укажите секрет для подписи" };

  const events = normalizePartnerWebhookEvents(input.events);
  const allowedEvents = toEventSet(PARTNER_WEBHOOK_EVENTS);
  if (events.some((event) => !allowedEvents.has(event))) {
    return { error: "Обнаружен неподдерживаемый тип события" };
  }

  const { data, error } = await input.supabase
    .from("partner_webhooks")
    .insert({
      organizer_id: input.organizerId,
      url: parsedUrl.url,
      secret,
      events,
      active: input.active,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось сохранить вебхук" };
  }

  return { webhook: mapWebhookRow(data) };
}

export async function updateOrganizerPartnerWebhook(input: {
  supabase: DbClient;
  organizerId: string;
  webhookId: string;
  patch: {
    url?: string;
    secret?: string;
    events?: PartnerWebhookEvent[];
    active?: boolean;
  };
}): Promise<{ webhook: PartnerWebhookRecord } | { error: string }> {
  const existing = await getOrganizerPartnerWebhookById(input.supabase, input.organizerId, input.webhookId);
  if (!existing) return { error: "Вебхук не найден" };

  const nextUrl = input.patch.url != null ? validatePartnerWebhookUrl(input.patch.url) : null;
  if (nextUrl && !nextUrl.ok) return { error: nextUrl.error };

  const nextSecret = input.patch.secret?.trim();
  if (input.patch.secret !== undefined && !nextSecret) {
    return { error: "Секрет не может быть пустым" };
  }

  const nextEvents =
    input.patch.events !== undefined
      ? normalizePartnerWebhookEvents(input.patch.events)
      : normalizePartnerWebhookEvents(existing.events);

  const { data, error } = await input.supabase
    .from("partner_webhooks")
    .update({
      url: nextUrl?.url ?? existing.url,
      secret: nextSecret ?? existing.secret,
      events: nextEvents,
      active: input.patch.active ?? existing.active,
    })
    .eq("id", input.webhookId)
    .eq("organizer_id", input.organizerId)
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось обновить вебхук" };
  }

  return { webhook: mapWebhookRow(data) };
}

export async function deleteOrganizerPartnerWebhook(input: {
  supabase: DbClient;
  organizerId: string;
  webhookId: string;
}): Promise<{ ok: true } | { error: string }> {
  const { error } = await input.supabase
    .from("partner_webhooks")
    .delete()
    .eq("id", input.webhookId)
    .eq("organizer_id", input.organizerId);

  if (error) {
    return { error: error.message };
  }
  return { ok: true };
}

export async function dispatchPartnerBookingWebhookEvent(input: {
  organizerId: string | null | undefined;
  event: PartnerWebhookEvent;
  booking: Booking;
}): Promise<void> {
  const organizerId = input.organizerId?.trim();
  if (!organizerId) return;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("partner_webhooks")
    .select("*")
    .eq("organizer_id", organizerId)
    .eq("active", true)
    .contains("events", [input.event])
    .order("created_at", { ascending: true });

  if (error || !data?.length) return;

  const envelope = buildDeliveryEnvelope({
    event: input.event,
    booking: input.booking,
    organizerId,
    source: "booking",
  });

  for (const webhook of data) {
    if (!webhook.url.trim()) continue;
    const createdDelivery = await insertDeliveryRecord({
      supabase,
      webhookId: webhook.id,
      event: input.event,
      payload: envelope,
    });
    if (!createdDelivery) continue;

    void deliverWithRetry({
      supabase,
      deliveryId: createdDelivery.id,
      webhook,
      event: input.event,
      payload: envelope,
    });
  }
}

export async function sendPartnerWebhookTestPing(input: {
  organizerId: string;
  webhookId: string;
}): Promise<
  | { ok: true; delivery: PartnerWebhookDeliveryRecord }
  | { ok: false; error: string; delivery?: PartnerWebhookDeliveryRecord | null }
> {
  const supabase = createSupabaseAdminClient();
  const webhook = await getOrganizerPartnerWebhookById(supabase, input.organizerId, input.webhookId);
  if (!webhook) {
    return { ok: false, error: "Вебхук не найден" };
  }

  if (!webhook.url.trim()) {
    return { ok: false, error: "Сначала укажите URL вебхука" };
  }

  const envelope = buildDeliveryEnvelope({
    event: "booking.created",
    organizerId: input.organizerId,
    source: "test",
    booking: {
      id: `test-${Date.now().toString(36)}`,
      userId: input.organizerId,
      tourId: "test",
      tourSlug: "test-webhook",
      tourTitle: "Тестовый вебхук",
      tourImage: "",
      status: "new",
      guests: 1,
      totalPriceUsd: 0,
      contactName: "Тест",
      contactEmail: "test@example.com",
      contactPhone: "",
      organizerComments: [],
      statusHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  const createdDelivery = await insertDeliveryRecord({
    supabase,
    webhookId: webhook.id,
    event: "booking.created",
    payload: envelope,
  });
  if (!createdDelivery) {
    return { ok: false, error: "Не удалось создать запись доставки" };
  }

  const delivery = await deliverWithRetry({
    supabase,
    deliveryId: createdDelivery.id,
    webhook,
    event: "booking.created",
    payload: envelope,
  });

  if (!delivery) {
    return { ok: false, error: "Не удалось выполнить тестовую отправку" };
  }

  if (delivery.status === "delivered") {
    return { ok: true, delivery };
  }

  return {
    ok: false,
    error: delivery.lastError ?? "Тестовая отправка завершилась ошибкой",
    delivery,
  };
}
