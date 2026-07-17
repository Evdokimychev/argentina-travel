import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  ADMIN_CAPABILITIES,
  ADMIN_PRESET_IDS,
  type AdminCapability,
  type AdminPresetId,
} from "@/types/admin";

export type StaffSecurityRecord = {
  userId: string;
  preset: AdminPresetId | null;
  capabilities: AdminCapability[];
  isActive: boolean;
  notes: string | null;
  rowVersion: number;
};

const CAPABILITY_ALLOWLIST = new Set<string>(ADMIN_CAPABILITIES);
const PRESET_ALLOWLIST = new Set<string>(ADMIN_PRESET_IDS);

function forbidden(message: string, code: string) {
  return NextResponse.json({ error: message, code }, { status: 403 });
}

export function isAdminPresetId(value: unknown): value is AdminPresetId {
  return typeof value === "string" && PRESET_ALLOWLIST.has(value);
}

export function parseAdminCapabilities(
  value: unknown,
): { ok: true; capabilities: AdminCapability[] } | { ok: false; error: string } {
  if (!Array.isArray(value)) {
    return { ok: false, error: "capabilities must be an array" };
  }

  const capabilities = [...new Set(value)];
  if (
    capabilities.some(
      (capability) => typeof capability !== "string" || !CAPABILITY_ALLOWLIST.has(capability),
    )
  ) {
    return { ok: false, error: "Unknown admin capability" };
  }

  return { ok: true, capabilities: capabilities as AdminCapability[] };
}

export function isConfirmedActiveOwner(record: StaffSecurityRecord | null): boolean {
  return Boolean(
    record?.isActive &&
      record.preset === "super_admin" &&
      record.capabilities.includes("*"),
  );
}

export function hasConsistentOwnerGrant(
  record: Pick<StaffSecurityRecord, "preset" | "capabilities">,
): boolean {
  const hasOwnerPreset = record.preset === "super_admin";
  const hasExplicitWildcard = record.capabilities.includes("*");
  return hasOwnerPreset === hasExplicitWildcard;
}

export function assertStaffTargetMutationAllowed(input: {
  actorId: string;
  target: StaffSecurityRecord | null;
}): { ok: true } | { ok: false; status: 403 | 409; code: string; error: string } {
  if (input.target?.userId === input.actorId) {
    return {
      ok: false,
      status: 403,
      code: "SELF_STAFF_MUTATION_FORBIDDEN",
      error: "Нельзя изменять собственное назначение администратора.",
    };
  }

  // Owner rows are deliberately immutable through this API. This stronger
  // invariant prevents concurrent requests from deleting the final owner
  // without requiring a new transactional database function.
  if (isConfirmedActiveOwner(input.target)) {
    return {
      ok: false,
      status: 409,
      code: "OWNER_STAFF_MUTATION_FORBIDDEN",
      error: "Назначение владельца нельзя изменить через API команды.",
    };
  }

  return { ok: true };
}

export async function fetchStaffSecurityRecord(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
): Promise<StaffSecurityRecord | null> {
  const { data, error } = await supabase
    .from("admin_staff")
    .select("user_id, preset, capabilities, is_active, notes, row_version")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    userId: data.user_id,
    preset: (data.preset as AdminPresetId | null) ?? null,
    capabilities: (data.capabilities ?? []) as AdminCapability[],
    isActive: data.is_active,
    notes: data.notes,
    rowVersion: data.row_version,
  };
}

export async function authorizeStaffManagementRequest(request: Request) {
  const auth = await authorizeAdminRequest(request, "users.manage");
  if (!auth.ok) return auth;

  // A service-role key is not a human owner session and must never manage the
  // staff trust root over HTTP.
  if (auth.via !== "session") {
    return {
      ok: false as const,
      response: forbidden("Требуется подтверждённая сессия владельца.", "OWNER_SESSION_REQUIRED"),
    };
  }

  const supabase = createSupabaseAdminClient();
  const owner = await fetchStaffSecurityRecord(supabase, auth.actorId);
  if (!isConfirmedActiveOwner(owner)) {
    return {
      ok: false as const,
      response: forbidden("Управление командой доступно только владельцу.", "OWNER_REQUIRED"),
    };
  }

  return { ok: true as const, auth, supabase, owner };
}
