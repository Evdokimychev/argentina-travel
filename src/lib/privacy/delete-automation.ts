import "server-only";

import pg from "pg";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revokeSupabaseAuthSessions } from "@/lib/auth-sessions";
import { sendPrivacyDeleteCompletedEmail } from "@/lib/notifications/email-delivery";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";

type DbClient = SupabaseClient<Database>;

type PrivacyRequestRow = Database["public"]["Tables"]["privacy_requests"]["Row"];
type BookingRow = Pick<
  Database["public"]["Tables"]["bookings"]["Row"],
  "id" | "user_id" | "guest_user_id" | "contact_email" | "payload"
>;

export type PrivacyDeleteProcessSummary = {
  queued: number;
  completed: number;
  failed: number;
  processedIds: string[];
  failedIds: string[];
};

const PERSONAL_ROWS_TO_DELETE = [
  ["user_favorites", "user_id"],
  ["push_subscriptions", "user_id"],
  ["user_interactions", "user_id"],
  ["notification_preferences", "user_id"],
  ["notification_events", "user_id"],
  ["blog_reading_history", "user_id"],
  ["organizer_inbox_reads", "user_id"],
  ["trip_prep_progress", "user_id"],
  ["group_trip_members", "user_id"],
  ["ai_match_sessions", "user_id"],
  ["expert_inquiries", "user_id"],
] as const;

function asObject(value: Json | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function resolvePrivacyDeleteIdentity(
  profile: {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null,
  requestMetadata: Json,
): { email: string | null; name: string | null } {
  const metadata = asObject(requestMetadata);
  const metadataEmail =
    typeof metadata.email === "string" && metadata.email.trim()
      ? metadata.email.trim()
      : null;
  const metadataName =
    typeof metadata.fullName === "string" && metadata.fullName.trim()
      ? metadata.fullName.trim()
      : null;
  const profileEmail = profile?.email?.trim() || null;
  const profileName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || null;

  return {
    email: profileEmail ?? metadataEmail,
    name: profileEmail ? profileName ?? metadataName : metadataName ?? profileName,
  };
}

function buildAnonymizedPayload(raw: Json, anonymizedAt: string): Json {
  const source = asObject(raw);
  const keepKeys = [
    "organizerTourId",
    "statusHistory",
    "invoices",
    "paymentSummary",
    "checkoutPaymentOption",
    "amountDue",
    "amountPaid",
    "bookingSource",
    "externalReference",
    "metadata",
    "attribution",
  ] as const;

  const result: Record<string, unknown> = {};
  for (const key of keepKeys) {
    if (key in source) {
      result[key] = source[key];
    }
  }
  result.gdprAnonymized = true;
  result.gdprAnonymizedAt = anonymizedAt;

  return result as Json;
}

async function fetchUserLinkedBookings(
  supabase: DbClient,
  userId: string,
  originalEmail: string | null
): Promise<BookingRow[]> {
  const byUser = await supabase
    .from("bookings")
    .select("id, user_id, guest_user_id, contact_email, payload")
    .or(`user_id.eq.${userId},guest_user_id.eq.${userId}`);

  const byEmailResponse = originalEmail?.trim()
    ? await supabase
        .from("bookings")
        .select("id, user_id, guest_user_id, contact_email, payload")
        .ilike("contact_email", originalEmail.trim())
    : null;

  const map = new Map<string, BookingRow>();
  for (const row of byUser.data ?? []) {
    map.set(row.id, row);
  }
  for (const row of byEmailResponse?.data ?? []) {
    map.set(row.id, row);
  }
  return [...map.values()];
}

async function anonymizeBookings(
  supabase: DbClient,
  userId: string,
  originalEmail: string | null,
  anonymizedAt: string
): Promise<number> {
  const linked = await fetchUserLinkedBookings(supabase, userId, originalEmail);
  let updatedCount = 0;

  for (const booking of linked) {
    const anonymizedEmail = `deleted+${booking.id.toLowerCase()}@example.invalid`;
    const { error } = await supabase
      .from("bookings")
      .update({
        user_id: null,
        guest_user_id: null,
        contact_name: "Удалённый пользователь",
        contact_email: anonymizedEmail,
        contact_phone: "",
        payload: buildAnonymizedPayload(booking.payload, anonymizedAt),
        updated_at: anonymizedAt,
      })
      .eq("id", booking.id);

    if (error) throw new Error(`bookings:${booking.id}: ${error.message}`);
    updatedCount += 1;
  }

  return updatedCount;
}

async function deletePersonalRows(supabase: DbClient, userId: string): Promise<number> {
  let deleted = 0;
  for (const [tableName, column] of PERSONAL_ROWS_TO_DELETE) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from(tableName)
      .delete()
      .eq(column, userId)
      .select("*");
    if (error) throw new Error(`${tableName}: ${error.message}`);
    deleted += Array.isArray(data) ? data.length : 0;
  }

  // Conversation messages cascade with their user-participating thread.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: threads, error: threadError } = await (supabase as any)
    .from("conversation_threads")
    .delete()
    .or(`tourist_user_id.eq.${userId},organizer_user_id.eq.${userId}`)
    .select("id");
  if (threadError) throw new Error(`conversation_threads: ${threadError.message}`);
  deleted += Array.isArray(threads) ? threads.length : 0;

  return deleted;
}

async function linkedRowIds(
  supabase: DbClient,
  tableName: string,
  userId: string,
  originalEmail: string | null,
  emailColumn = "customer_email",
): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (supabase as any).from(tableName);
  const byUser = await table.select("id").eq("user_id", userId);
  if (byUser.error) throw new Error(`${tableName}: ${byUser.error.message}`);
  const byEmail = originalEmail
    ? await table.select("id").ilike(emailColumn, originalEmail)
    : { data: [] as Array<{ id: string }>, error: null };
  if (byEmail.error) throw new Error(`${tableName}: ${byEmail.error.message}`);

  return [
    ...new Set(
      [...(byUser.data ?? []), ...(byEmail.data ?? [])]
        .map((row: { id?: string }) => row.id)
        .filter((id: string | undefined): id is string => Boolean(id)),
    ),
  ];
}

async function anonymizePartnerBookingRows(
  supabase: DbClient,
  userId: string,
  originalEmail: string | null,
): Promise<number> {
  let updated = 0;
  for (const tableName of ["tripster_booking_requests", "youtravel_booking_requests"] as const) {
    const ids = await linkedRowIds(supabase, tableName, userId, originalEmail);
    for (const id of ids) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from(tableName)
        .update({
          user_id: null,
          customer_name: "Удалённый пользователь",
          customer_email: `deleted+${id}@example.invalid`,
          customer_phone: "",
          ...(tableName === "tripster_booking_requests"
            ? { message_to_guide: null }
            : { message: null }),
        })
        .eq("id", id);
      if (error) throw new Error(`${tableName}:${id}: ${error.message}`);
      updated += 1;
    }
  }
  return updated;
}

async function anonymizeOtherCommerceRows(
  supabase: DbClient,
  userId: string,
  originalEmail: string | null,
): Promise<number> {
  let updated = 0;
  const shopOrderIds = await linkedRowIds(supabase, "shop_orders", userId, originalEmail);
  for (const id of shopOrderIds) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("shop_orders")
      .update({
        user_id: null,
        guest_email: null,
        customer_name: "Удалённый пользователь",
        customer_email: `deleted+${id}@example.invalid`,
        customer_phone: "",
        notes: null,
      })
      .eq("id", id);
    if (error) throw new Error(`shop_orders:${id}: ${error.message}`);
    updated += 1;
  }

  const waitlistIds = await linkedRowIds(
    supabase,
    "tour_waitlist_entries",
    userId,
    originalEmail,
    "email",
  );
  for (const id of waitlistIds) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("tour_waitlist_entries")
      .update({
        user_id: null,
        email: `deleted+${id}@example.invalid`,
        contact_name: "Удалённый пользователь",
        contact_phone: null,
        note: null,
      })
      .eq("id", id);
    if (error) throw new Error(`tour_waitlist_entries:${id}: ${error.message}`);
    updated += 1;
  }
  return updated;
}

async function deleteRowsLinkedByEmail(
  supabase: DbClient,
  originalEmail: string | null,
): Promise<number> {
  if (!originalEmail) return 0;
  let deleted = 0;
  for (const [tableName, emailColumn] of [
    ["newsletter_subscribers", "email"],
    ["contact_submissions", "email"],
  ] as const) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from(tableName)
      .delete()
      .ilike(emailColumn, originalEmail)
      .select("id");
    if (error) throw new Error(`${tableName}: ${error.message}`);
    deleted += Array.isArray(data) ? data.length : 0;
  }

  // Remove prior queued/delivered messages addressed to the account.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: emails, error: emailError } = await (supabase as any)
    .from("email_delivery_outbox")
    .delete()
    .contains("recipients", [originalEmail.trim().toLowerCase()])
    .select("id");
  if (emailError) throw new Error(`email_delivery_outbox: ${emailError.message}`);
  deleted += Array.isArray(emails) ? emails.length : 0;
  return deleted;
}

function mergeMetadata(
  previous: Json,
  patch: Record<string, unknown>
): Database["public"]["Tables"]["privacy_requests"]["Update"]["metadata"] {
  return {
    ...asObject(previous),
    ...patch,
  } as Json;
}

export function completedDeleteMetadata(input: {
  processingStartedAt: string;
  completedAt: string;
  bookingsAnonymized: number;
  sessionsRevoked: number;
  relatedRowsDeleted: number;
  commerceRowsAnonymized: number;
}): Database["public"]["Tables"]["privacy_requests"]["Update"]["metadata"] {
  return { ...input } as Json;
}

export async function settlePrivacyDeleteOperation<T>(input: {
  perform: () => Promise<T>;
  markFailed: (message: string) => Promise<string | null>;
  notifyCompleted: (result: T) => Promise<unknown>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  let result: T;
  try {
    result = await input.perform();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    let failureMarkError: string | null;
    try {
      failureMarkError = await input.markFailed(message);
    } catch (markError) {
      failureMarkError = markError instanceof Error ? markError.message : "unknown failure mark error";
    }

    return failureMarkError
      ? { ok: false, error: `${message}; additionally failed to mark request as failed: ${failureMarkError}` }
      : { ok: false, error: message };
  }

  try {
    await input.notifyCompleted(result);
  } catch (error) {
    console.error("[privacy_delete_completion_notification_failed]", {
      error: error instanceof Error ? error.message : "unknown",
    });
  }

  return { ok: true };
}

async function processDeleteRequest(
  supabase: DbClient,
  request: PrivacyRequestRow
): Promise<{ ok: true } | { ok: false; error: string }> {
  const startedAt = new Date().toISOString();
  const markProcessing = await supabase
    .from("privacy_requests")
    .update({
      status: "processing",
      metadata: mergeMetadata(request.metadata, {
        processingStartedAt: startedAt,
      }),
    })
    .eq("id", request.id)
    .eq("status", "approved")
    .select("id")
    .maybeSingle();

  if (markProcessing.error) {
    return { ok: false, error: markProcessing.error.message };
  }
  if (!markProcessing.data) {
    return { ok: false, error: "Заявка уже обрабатывается или закрыта" };
  }

  return settlePrivacyDeleteOperation({
    perform: async () => {
      const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name")
      .eq("id", request.user_id)
      .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      const { email: originalEmail, name: originalName } = resolvePrivacyDeleteIdentity(
        profile,
        request.metadata,
      );
      const completedAt = new Date().toISOString();

      const { error: authBanError } = await supabase.auth.admin.updateUserById(request.user_id, {
        ban_duration: "876000h",
        user_metadata: {
          gdpr_deleted_at: completedAt,
        },
      });
      if (authBanError) {
        throw new Error(authBanError.message);
      }

      const revokeResult = await revokeSupabaseAuthSessions(request.user_id);
      if (!revokeResult.ok) {
        throw new Error("Не удалось отозвать auth-сессии: DATABASE_URL не задан");
      }

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          first_name: "Удалён",
          last_name: "пользователь",
          phone: null,
          email: null,
          avatar_url: null,
          date_of_birth: null,
          is_blocked: true,
          deleted_at: completedAt,
          anonymized_at: completedAt,
          updated_at: completedAt,
        })
        .eq("id", request.user_id);

      if (profileUpdateError) {
        throw new Error(profileUpdateError.message);
      }

      const bookingsAnonymized = await anonymizeBookings(
        supabase,
        request.user_id,
        originalEmail,
        completedAt
      );
      const personalRowsDeleted = await deletePersonalRows(supabase, request.user_id);
      const emailRowsDeleted = await deleteRowsLinkedByEmail(supabase, originalEmail);
      const relatedRowsDeleted = personalRowsDeleted + emailRowsDeleted;
      const partnerRequestsAnonymized = await anonymizePartnerBookingRows(
        supabase,
        request.user_id,
        originalEmail,
      );
      const otherCommerceRowsAnonymized = await anonymizeOtherCommerceRows(
        supabase,
        request.user_id,
        originalEmail,
      );
      const commerceRowsAnonymized = partnerRequestsAnonymized + otherCommerceRowsAnonymized;

      const completeResult = await supabase
        .from("privacy_requests")
        .update({
          status: "completed",
          processed_at: completedAt,
          reason: null,
          metadata: completedDeleteMetadata({
            processingStartedAt: startedAt,
            completedAt,
            bookingsAnonymized,
            sessionsRevoked: revokeResult.revokedCount,
            relatedRowsDeleted,
            commerceRowsAnonymized,
          }),
        })
        .eq("id", request.id)
        .eq("status", "processing")
        .select("id")
        .maybeSingle();

      if (completeResult.error) {
        throw new Error(completeResult.error.message);
      }
      if (!completeResult.data) {
        throw new Error("Статус заявки изменился до завершения обработки");
      }

      return { originalEmail, originalName, completedAt };
    },
    markFailed: async (message) => {
      const failResult = await supabase
        .from("privacy_requests")
        .update({
          status: "failed",
          notes: `Ошибка автоматической обработки: ${message}`.slice(0, 4000),
          metadata: mergeMetadata(request.metadata, {
            processingStartedAt: startedAt,
            failedAt: new Date().toISOString(),
            lastError: message,
          }),
        })
        .eq("id", request.id)
        .eq("status", "processing")
        .select("id")
        .maybeSingle();

      if (failResult.error) return failResult.error.message;
      return failResult.data ? null : "request status is no longer processing";
    },
    notifyCompleted: async ({ originalEmail, originalName, completedAt }) => {
      if (!originalEmail) return;
      await sendPrivacyDeleteCompletedEmail({
        recipientEmail: originalEmail,
        recipientName: originalName,
        requestId: request.id,
        completedAt,
      });
    },
  });
}

export async function processApprovedPrivacyDeleteRequests(
  limit = 20
): Promise<PrivacyDeleteProcessSummary> {
  const supabase = createSupabaseAdminClient();
  const batchSize = Math.max(1, Math.min(100, Math.floor(limit)));

  const { data, error } = await supabase
    .from("privacy_requests")
    .select("*")
    .eq("request_type", "delete")
    .eq("status", "approved")
    .order("requested_at", { ascending: true })
    .limit(batchSize);

  if (error) {
    throw new Error(error.message);
  }

  const queue = data ?? [];
  const processedIds: string[] = [];
  const failedIds: string[] = [];

  for (const request of queue) {
    const result = await processDeleteRequest(supabase, request);
    processedIds.push(request.id);
    if (!result.ok) {
      failedIds.push(request.id);
    }
  }

  return {
    queued: queue.length,
    completed: queue.length - failedIds.length,
    failed: failedIds.length,
    processedIds,
    failedIds,
  };
}
