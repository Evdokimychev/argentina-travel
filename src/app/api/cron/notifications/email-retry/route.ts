import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { processEmailOutboxRetries } from "@/lib/notifications/email-delivery";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const result = await processEmailOutboxRetries();
    return NextResponse.json({ ok: result.failed === 0, ...result }, { status: result.failed ? 500 : 200 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Email retry failed" },
      { status: 500 },
    );
  }
}
