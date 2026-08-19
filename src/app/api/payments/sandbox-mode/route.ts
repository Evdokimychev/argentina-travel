import { NextResponse } from "next/server";
import { isOwnPaymentRuntimeEnabled } from "@/lib/payments/own-payment-gate";
import { isPaymentSandboxMode } from "@/lib/payments/sandbox-mode";

/**
 * Sandbox probe — never advertises sandbox when own online payment is POST_LAUNCH-disabled.
 */
export async function GET() {
  const enabled = isOwnPaymentRuntimeEnabled() && isPaymentSandboxMode();
  return NextResponse.json(
    { enabled },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
