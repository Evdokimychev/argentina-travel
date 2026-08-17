import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type AuditLogInput = {
  actorUserId: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  ipAddress?: string | null;
};

/** Actions that must not silently lose their security journal row. */
export const CRITICAL_AUDIT_ACTIONS = new Set([
  "staff.role_change",
  "staff.capability_change",
  "users.block",
  "users.unblock",
  "privacy.export",
  "privacy.delete",
  "privacy.decision",
  "finance.refund.prepare",
  "finance.refund.approve",
  "finance.refund.reject",
  "system.settings.change",
  "integrations.credentials.change",
  "security.settings.change",
]);

function sanitizeAuditPayload(payload: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!payload) return {};
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (/(password|secret|token|authorization|cookie|passport|document)/i.test(key)) {
      sanitized[key] = "[redacted]";
      continue;
    }
    if (typeof value === "string" && value.length > 500) {
      sanitized[key] = `${value.slice(0, 500)}…`;
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

/** Write admin audit entry via service role (best-effort for non-critical actions). */
export async function writeAdminAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    await admin.from("admin_audit_log").insert({
      actor_user_id: input.actorUserId,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      payload: sanitizeAuditPayload(input.payload) as Json,
      ip_address: input.ipAddress ?? null,
    });
  } catch {
    // Non-critical audit must not break primary operations
  }
}

/** Test/ops helper — same redaction used before durable audit insert. */
export function sanitizeAdminAuditPayloadForTest(
  payload: Record<string, unknown> | undefined,
): Record<string, unknown> {
  return sanitizeAuditPayload(payload);
}

export type CriticalAuditResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Durable security audit for critical mutations.
 * Callers must treat `ok: false` as a failed security journal write and
 * either abort the mutation (preferred when still in the same request)
 * or enqueue a recoverable outbox repair — never pretend success.
 */
export async function writeCriticalAdminAuditLog(
  input: AuditLogInput,
): Promise<CriticalAuditResult> {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("admin_audit_log").insert({
      actor_user_id: input.actorUserId,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      payload: {
        ...sanitizeAuditPayload(input.payload),
        audit_class: "critical",
      } as Json,
      ip_address: input.ipAddress ?? null,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "audit_write_failed",
    };
  }
}

export function clientIpFromRequest(request: Request): string | null {
  const vercelForwarded = request.headers.get("x-vercel-forwarded-for")?.trim();
  if (vercelForwarded) return vercelForwarded.split(",")[0]?.trim() || null;
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return null;
  const parts = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || null;
}
