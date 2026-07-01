import { NextResponse } from "next/server";
import { isPaymentSandboxMode } from "@/lib/payments/sandbox-mode";

export async function GET() {
  return NextResponse.json({ enabled: isPaymentSandboxMode() });
}
