import "server-only";

import pg from "pg";
import type { SupabaseClient } from "@supabase/supabase-js";
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

function asObject(value: Json | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
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

async function revokeSupabaseSessions(userId: string): Promise<{ ok: boolean; revokedCount: number }> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    return { ok: false, revokedCount: 0 };
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const { rowCount } = await client.query("delete from auth.sessions where user_id = $1", [userId]);
    return {
      ok: true,
      revokedCount: rowCount ?? 0,
    };
  } finally {
    await client.end().catch(() => undefined);
  }
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

    if (!error) {
      updatedCount += 1;
    }
  }

  return updatedCount;
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

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name")
      .eq("id", request.user_id)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message);
    }

    const originalEmail = profile?.email ?? null;
    const originalName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || null;
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

    const revokeResult = await revokeSupabaseSessions(request.user_id);
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

    const { error: completeError } = await supabase
      .from("privacy_requests")
      .update({
        status: "completed",
        processed_at: completedAt,
        metadata: mergeMetadata(request.metadata, {
          processingStartedAt: startedAt,
          completedAt,
          bookingsAnonymized,
          sessionsRevoked: revokeResult.revokedCount,
        }),
      })
      .eq("id", request.id);

    if (completeError) {
      throw new Error(completeError.message);
    }

    if (originalEmail) {
      await sendPrivacyDeleteCompletedEmail({
        recipientEmail: originalEmail,
        recipientName: originalName,
        requestId: request.id,
        completedAt,
      });
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    const { error: failMarkError } = await supabase
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
      .eq("id", request.id);

    if (failMarkError) {
      return { ok: false, error: `${message}; additionally failed to mark request as failed` };
    }

    return { ok: false, error: message };
  }
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
