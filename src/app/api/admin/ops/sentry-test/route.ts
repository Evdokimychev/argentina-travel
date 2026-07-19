import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { captureOperationalTestException } from "@/lib/monitoring/sentry";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const adminAuth = await authorizeAdminRequest(request);
  if (!adminAuth.ok) return adminAuth.response;

  const result = await captureOperationalTestException();
  if (!result.enabled) {
    return NextResponse.json(
      { ok: false, ...result, error: "sentry_not_configured" },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, ...result });
}
