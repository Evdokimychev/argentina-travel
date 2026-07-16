import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

type DbClient = SupabaseClient<Database>;
export type PartnerBookingProvider = "tripster" | "youtravel";

export type StoredPartnerBookingResponse = {
  statusCode: number;
  payload: Record<string, unknown>;
};

export type PartnerBookingClaim =
  | { state: "claimed" }
  | { state: "replay"; response: StoredPartnerBookingResponse }
  | { state: "in_progress" }
  | { state: "conflict" }
  | { state: "unavailable" };

export function isValidBookingOperationKey(value: string | null): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

export function fingerprintPartnerBookingRequest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function claimPartnerBookingOperation(
  supabase: DbClient,
  input: {
    provider: PartnerBookingProvider;
    idempotencyKey: string;
    requestFingerprint: string;
  },
): Promise<PartnerBookingClaim> {
  // The generated database type intentionally lags new migrations in worktrees.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (supabase as any).from("partner_booking_operations");
  const { error: insertError } = await table.insert({
    provider: input.provider,
    idempotency_key: input.idempotencyKey,
    request_fingerprint: input.requestFingerprint,
    status: "pending",
  });

  if (!insertError) return { state: "claimed" };

  const { data, error } = await table
    .select("request_fingerprint, status, response_status, response_payload")
    .eq("provider", input.provider)
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();

  if (error || !data) return { state: "unavailable" };
  if (data.request_fingerprint !== input.requestFingerprint) return { state: "conflict" };

  if (
    data.status === "completed" &&
    Number.isInteger(data.response_status) &&
    data.response_payload &&
    typeof data.response_payload === "object" &&
    !Array.isArray(data.response_payload)
  ) {
    return {
      state: "replay",
      response: {
        statusCode: data.response_status,
        payload: data.response_payload as Record<string, unknown>,
      },
    };
  }

  return { state: "in_progress" };
}

export async function completePartnerBookingOperation(
  supabase: DbClient,
  input: {
    provider: PartnerBookingProvider;
    idempotencyKey: string;
    response: StoredPartnerBookingResponse;
  },
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("partner_booking_operations")
    .update({
      status: "completed",
      response_status: input.response.statusCode,
      response_payload: input.response.payload as Json,
      completed_at: new Date().toISOString(),
    })
    .eq("provider", input.provider)
    .eq("idempotency_key", input.idempotencyKey)
    .eq("status", "pending");

  return !error;
}
