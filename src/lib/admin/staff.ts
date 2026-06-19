import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mergeCapabilities } from "@/lib/admin/capabilities";
import type { AdminCapability, AdminPresetId } from "@/types/admin";
import type { Database } from "@/types/database";
import { userHasAccountRole } from "@/types/user";
import type { SessionUser } from "@/types/user";

export type AdminStaffRecord = {
  userId: string;
  capabilities: AdminCapability[];
  preset: AdminPresetId | null;
  isActive: boolean;
};

const BOOTSTRAP_CAPABILITIES: AdminCapability[] = ["*"];

type DbClient = SupabaseClient<Database>;

function bootstrapRecord(userId: string): AdminStaffRecord {
  return {
    userId,
    capabilities: BOOTSTRAP_CAPABILITIES,
    preset: null,
    isActive: true,
  };
}

function isMissingRelationError(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("does not exist") ||
    lower.includes("could not find the table") ||
    lower.includes("schema cache")
  );
}

async function loadPresetCapabilities(
  supabase: DbClient,
  presetId: string
): Promise<string[]> {
  const { data: presetRow, error } = await supabase
    .from("admin_role_presets")
    .select("capabilities")
    .eq("id", presetId)
    .maybeSingle();

  if (error && isMissingRelationError(error.message)) return [];
  return presetRow?.capabilities ?? [];
}

/**
 * Resolve admin capabilities using the caller's Supabase client (cookie session).
 * Works with RLS — does not require SUPABASE_SERVICE_ROLE_KEY.
 */
export async function resolveAdminCapabilitiesWithClient(
  supabase: DbClient,
  user: SessionUser
): Promise<AdminStaffRecord | null> {
  if (!userHasAccountRole(user, "admin")) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, roles, is_blocked")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError?.message && isMissingRelationError(profileError.message)) {
    return bootstrapRecord(user.id);
  }

  if (profileError || !profile) {
    // Session user already verified as admin — allow bootstrap when profile read fails transiently
    return bootstrapRecord(user.id);
  }

  if (profile.is_blocked) return null;
  if (!profile.roles?.includes("admin")) return null;

  const { data: staff, error: staffError } = await supabase
    .from("admin_staff")
    .select("preset, capabilities, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (staffError && isMissingRelationError(staffError.message)) {
    return bootstrapRecord(user.id);
  }

  if (!staff) return bootstrapRecord(user.id);
  if (!staff.is_active) return null;

  let presetCaps: string[] = [];
  if (staff.preset) {
    presetCaps = await loadPresetCapabilities(supabase, staff.preset);
  }

  return {
    userId: user.id,
    capabilities: mergeCapabilities(presetCaps, staff.capabilities ?? []),
    preset: (staff.preset as AdminPresetId | null) ?? null,
    isActive: true,
  };
}

/** Service-role path for background jobs and legacy callers. */
export async function resolveAdminCapabilities(userId: string): Promise<AdminStaffRecord | null> {
  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, roles, is_blocked")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) return null;
  if (profile.is_blocked) return null;
  if (!profile.roles?.includes("admin")) return null;

  const { data: staff, error: staffError } = await admin
    .from("admin_staff")
    .select("preset, capabilities, is_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (staffError && isMissingRelationError(staffError.message)) {
    return bootstrapRecord(userId);
  }

  if (!staff) return bootstrapRecord(userId);
  if (!staff.is_active) return null;

  let presetCaps: string[] = [];
  if (staff.preset) {
    presetCaps = await loadPresetCapabilities(admin, staff.preset);
  }

  return {
    userId,
    capabilities: mergeCapabilities(presetCaps, staff.capabilities ?? []),
    preset: (staff.preset as AdminPresetId | null) ?? null,
    isActive: true,
  };
}

export async function resolveAdminCapabilitiesFromSession(
  user: SessionUser | null,
  supabase?: DbClient
): Promise<AdminStaffRecord | null> {
  if (!user || !userHasAccountRole(user, "admin")) return null;
  if (supabase) return resolveAdminCapabilitiesWithClient(supabase, user);
  return resolveAdminCapabilities(user.id);
}
