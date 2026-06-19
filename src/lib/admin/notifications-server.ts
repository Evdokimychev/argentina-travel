import type { SupabaseClient } from "@supabase/supabase-js";
import { syncPendingToursToQueue } from "@/lib/admin/moderation-server";
import { syncPendingReviewsToQueue } from "@/lib/reviews-server";
import type { Database, Json } from "@/types/database";
import type { AdminNotificationItem, AdminNotificationType } from "@/types/admin-notifications";

type DbClient = SupabaseClient<Database>;
type AdminNotificationRow = Database["public"]["Tables"]["admin_notifications"]["Row"];

type CreateNotificationInput = {
  type: AdminNotificationType;
  title: string;
  body: string;
  href?: string | null;
  metadata?: Json;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const CONTACT_KIND_LABELS: Record<string, string> = {
  general: "обращение",
  tour_inquiry: "вопрос по туру",
  service_request: "запрос по услуге",
  product_inquiry: "заявка по магазину",
  organizer_application: "заявка организатора",
  consultation: "запрос консультации",
};

function rowToNotification(row: AdminNotificationRow): AdminNotificationItem {
  return {
    id: row.id,
    type: row.type as AdminNotificationType,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at,
    metadata: row.metadata,
  };
}

function metadataString(metadata: Json | undefined, key: string): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function withEntityMetadata(metadata: Json | undefined, entityType: string, entityId: string): Json {
  const base =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? { ...metadata }
      : {};
  return {
    ...base,
    entity_type: entityType,
    entity_id: entityId,
  } as Json;
}

export async function createNotification(
  supabase: DbClient,
  input: CreateNotificationInput
): Promise<AdminNotificationItem | null> {
  const entityType = metadataString(input.metadata, "entity_type");
  const entityId = metadataString(input.metadata, "entity_id");

  if (entityType && entityId) {
    const { data: existing } = await supabase
      .from("admin_notifications")
      .select("*")
      .eq("type", input.type)
      .contains("metadata", { entity_type: entityType, entity_id: entityId })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) return rowToNotification(existing);
  }

  const { data, error } = await supabase
    .from("admin_notifications")
    .insert({
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .maybeSingle();

  if (error || !data) return null;
  return rowToNotification(data);
}

export async function fetchUnread(
  supabase: DbClient,
  limit = 20
): Promise<AdminNotificationItem[]> {
  const { data, error } = await supabase
    .from("admin_notifications")
    .select("*")
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(rowToNotification);
}

export async function fetchRecentNotifications(
  supabase: DbClient,
  limit = 20
): Promise<AdminNotificationItem[]> {
  const { data, error } = await supabase
    .from("admin_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(rowToNotification);
}

export async function countUnreadNotifications(supabase: DbClient): Promise<number> {
  const { count } = await supabase
    .from("admin_notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
}

export async function markRead(
  supabase: DbClient,
  notificationId: string
): Promise<AdminNotificationItem | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("admin_notifications")
    .update({ read_at: now })
    .eq("id", notificationId)
    .is("read_at", null)
    .select("*")
    .maybeSingle();

  if (error) return null;
  if (data) return rowToNotification(data);

  const { data: existing } = await supabase
    .from("admin_notifications")
    .select("*")
    .eq("id", notificationId)
    .maybeSingle();

  return existing ? rowToNotification(existing) : null;
}

export async function markAllRead(supabase: DbClient): Promise<number> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("admin_notifications")
    .update({ read_at: now })
    .is("read_at", null)
    .select("id");

  if (error || !data) return 0;
  return data.length;
}

async function syncModerationNotifications(supabase: DbClient): Promise<void> {
  await syncPendingToursToQueue(supabase);
  await syncPendingReviewsToQueue(supabase);

  const { data: rows, error } = await supabase
    .from("moderation_queue")
    .select("id, entity_type, entity_id, reason, metadata")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !rows?.length) return;

  for (const row of rows) {
    const title =
      row.entity_type === "review" ? "Отзыв ожидает модерации" : "Тур ожидает модерации";
    const entityTitle =
      metadataString(row.metadata, "title") ??
      metadataString(row.metadata, "tourTitle") ??
      row.entity_id;

    const body = row.reason
      ? `${entityTitle} · ${row.reason}`
      : `${entityTitle} ожидает проверки`;

    await createNotification(supabase, {
      type: "moderation_queue",
      title,
      body,
      href: "/admin/marketplace/moderation",
      metadata: withEntityMetadata(row.metadata, row.entity_type, row.entity_id),
    });
  }
}

async function syncLeadNotifications(supabase: DbClient): Promise<void> {
  const since = new Date(Date.now() - ONE_DAY_MS).toISOString();
  const [newsletter, contacts] = await Promise.all([
    supabase
      .from("newsletter_subscribers")
      .select("id, email, source")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("contact_submissions")
      .select("id, kind, name, email")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  for (const row of newsletter.data ?? []) {
    const emailLabel = row.email || "без email";
    await createNotification(supabase, {
      type: "new_lead",
      title: "Новая подписка на рассылку",
      body: `${emailLabel} · источник: ${row.source ?? "не указан"}`,
      href: "/admin/operations/leads",
      metadata: withEntityMetadata(
        {
          source: row.source ?? null,
          email: row.email,
        } as Json,
        "newsletter_subscriber",
        row.id
      ),
    });
  }

  for (const row of contacts.data ?? []) {
    const kind = CONTACT_KIND_LABELS[row.kind] ?? "обращение";
    const author = row.name?.trim() || row.email?.trim() || "без имени";
    await createNotification(supabase, {
      type: "new_lead",
      title: "Новая контактная заявка",
      body: `${author} · ${kind}`,
      href: "/admin/operations/leads",
      metadata: withEntityMetadata(
        {
          kind: row.kind,
          name: row.name,
          email: row.email,
        } as Json,
        "contact_submission",
        row.id
      ),
    });
  }
}

async function syncPendingPaymentNotifications(supabase: DbClient): Promise<void> {
  const { data: rows, error } = await supabase
    .from("bookings")
    .select("id, tour_title, contact_email, payment_status")
    .in("payment_status", ["pending", "partial"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !rows?.length) return;

  for (const row of rows) {
    const isPartial = row.payment_status === "partial";
    await createNotification(supabase, {
      type: "pending_payment",
      title: isPartial ? "Требуется доплата по бронированию" : "Ожидается оплата бронирования",
      body: `${row.tour_title} · ${row.contact_email}`,
      href: "/admin/operations/payments",
      metadata: withEntityMetadata(
        {
          payment_status: row.payment_status,
          tour_title: row.tour_title,
          contact_email: row.contact_email,
        } as Json,
        "booking_payment",
        row.id
      ),
    });
  }
}

export async function syncAdminNotifications(supabase: DbClient): Promise<void> {
  await Promise.all([
    syncModerationNotifications(supabase),
    syncLeadNotifications(supabase),
    syncPendingPaymentNotifications(supabase),
  ]);
}
