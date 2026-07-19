import "server-only";

import { NextResponse } from "next/server";
import { fetchSiteModuleControlSnapshot, type SiteModuleControlSnapshot } from "@/lib/site-settings-server";
import type { MobilityVertical } from "@/types/mobility";

export type MobilityModuleDecision =
  | { allowed: true; allowNativeOffers: boolean }
  | { allowed: false; reason: "disabled" | "settings_unavailable" };

export function evaluateMobilityModuleAccess(
  snapshot: SiteModuleControlSnapshot,
  vertical: MobilityVertical,
): MobilityModuleDecision {
  if (!snapshot.ok) return { allowed: false, reason: "settings_unavailable" };
  const mode = vertical === "rental"
    ? snapshot.modules.carRentalMode
    : snapshot.modules.transfersMode;
  if (mode === "disabled") return { allowed: false, reason: "disabled" };
  return { allowed: true, allowNativeOffers: mode === "preparing_hybrid" };
}

export async function resolveMobilityModuleAccess(vertical: MobilityVertical): Promise<MobilityModuleDecision> {
  return evaluateMobilityModuleAccess(await fetchSiteModuleControlSnapshot(), vertical);
}

export function mobilityModuleBlockedResponse(
  decision: Extract<MobilityModuleDecision, { allowed: false }>,
): NextResponse {
  return NextResponse.json(
    {
      error: decision.reason === "settings_unavailable"
        ? "Не удалось проверить доступность раздела. Повторите позже."
        : "Раздел временно недоступен.",
      code: decision.reason === "settings_unavailable" ? "MODULE_POLICY_UNAVAILABLE" : "MODULE_DISABLED",
    },
    { status: 503, headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}

export async function enforceMobilityModuleAccess(vertical: MobilityVertical): Promise<NextResponse | null> {
  const decision = await resolveMobilityModuleAccess(vertical);
  return decision.allowed ? null : mobilityModuleBlockedResponse(decision);
}
