import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type AuditLogInput = {
  actorUserId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  ipAddress?: string | null;
};

/** Write admin audit entry via service role (best-effort, non-blocking for callers). */
export async function writeAdminAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    await admin.from("admin_audit_log").insert({
      actor_user_id: input.actorUserId,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      payload: (input.payload ?? {}) as Json,
      ip_address: input.ipAddress ?? null,
    });
  } catch {
    // Audit must not break primary operations
  }
}

export function clientIpFromRequest(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}
