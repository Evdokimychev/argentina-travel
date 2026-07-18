import "server-only";

import { NextResponse } from "next/server";
import {
  fetchSiteModuleControlSnapshot,
  type SiteModuleControlSnapshot,
} from "@/lib/site-settings-server";

export type PublicModuleId = "tours" | "transfers" | "apartments";
export type PublicModuleIntent =
  | "public_read"
  | "public_write"
  | "history_read"
  | "administrative_read"
  | "safety_write";

export type PublicModuleDecision =
  | { allowed: true }
  | { allowed: false; reason: "disabled" | "settings_unavailable" };

const CONTINUITY_INTENTS = new Set<PublicModuleIntent>([
  "history_read",
  "administrative_read",
  "safety_write",
]);

export function evaluatePublicModuleAccess(
  snapshot: SiteModuleControlSnapshot,
  module: PublicModuleId,
  intent: PublicModuleIntent,
): PublicModuleDecision {
  if (CONTINUITY_INTENTS.has(intent)) return { allowed: true };
  if (!snapshot.ok) return { allowed: false, reason: "settings_unavailable" };

  const enabled = module === "tours"
    ? snapshot.navigation.showTours
    : module === "apartments"
      ? snapshot.modules.apartmentsMode === "native_request"
      : snapshot.modules.transfersMode !== "disabled";

  return enabled ? { allowed: true } : { allowed: false, reason: "disabled" };
}

function blockedModuleResponse(
  module: PublicModuleId,
  reason: "disabled" | "settings_unavailable",
): NextResponse {
  const label = module === "tours" ? "Туры" : module === "apartments" ? "Апартаменты" : "Трансферы";
  const unavailable = reason === "settings_unavailable";
  return NextResponse.json(
    {
      error: unavailable
        ? "Не удалось проверить доступность раздела. Повторите позже."
        : `${label} временно недоступны.`,
      code: unavailable ? "MODULE_POLICY_UNAVAILABLE" : "MODULE_DISABLED",
      module,
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}

export async function enforcePublicModuleAccess(
  module: PublicModuleId,
  intent: PublicModuleIntent,
): Promise<NextResponse | null> {
  const decision = evaluatePublicModuleAccess(
    await fetchSiteModuleControlSnapshot(),
    module,
    intent,
  );
  return decision.allowed ? null : blockedModuleResponse(module, decision.reason);
}
