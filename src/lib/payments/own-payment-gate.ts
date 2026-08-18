import { NextResponse } from "next/server";
import { isCommercialModeEnabled } from "@/lib/commerce/business-model";
import { publicApiError } from "@/lib/public-api/safe-error";

/**
 * Sprint 7 — own online payment is POST_LAUNCH (`productionEnabled: false`).
 * Block *new* checkout issuance and provider session creation.
 * Payment webhooks and expire-unpaid cron stay open for continuity.
 */
export function rejectIfOwnPaymentDisabled(): NextResponse | null {
  if (isCommercialModeEnabled("own_payment")) return null;
  return NextResponse.json(publicApiError("PAYMENT_UNAVAILABLE"), {
    status: 503,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export function isOwnPaymentRuntimeEnabled(): boolean {
  return isCommercialModeEnabled("own_payment");
}
