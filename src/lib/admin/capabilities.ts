import type { AdminCapability } from "@/types/admin";

export function hasAdminCapability(
  granted: readonly string[] | undefined,
  required: AdminCapability
): boolean {
  if (!granted?.length) return false;
  if (granted.includes("*")) return true;
  return granted.includes(required);
}

export function hasAnyAdminCapability(
  granted: readonly string[] | undefined,
  required: AdminCapability[]
): boolean {
  return required.some((cap) => hasAdminCapability(granted, cap));
}

/** Merge preset capabilities with explicit overrides (deduplicated). */
export function mergeCapabilities(
  presetCaps: readonly string[],
  overrides: readonly string[]
): AdminCapability[] {
  const merged = new Set<string>([...presetCaps, ...overrides]);
  return Array.from(merged) as AdminCapability[];
}
