import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { fetchCronHealthReport } from "@/lib/ops/ops-status";
import { fetchOutboxHealthSnapshot } from "@/lib/ops/outbox-health-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronAuth = authorizeCronRequest(request);

  if (!cronAuth.ok) {
    const adminAuth = await authorizeAdminRequest(request);
    if (!adminAuth.ok) return adminAuth.response;
  }

  const report = await fetchCronHealthReport();
  try {
    const outbox = await fetchOutboxHealthSnapshot();
    const ok = report.ok && outbox.ok;
    return NextResponse.json({
      ...report,
      ok,
      status: ok ? "ok" : "degraded",
      outbox,
    });
  } catch {
    return NextResponse.json({
      ...report,
      ok: false,
      status: "degraded",
      outbox: {
        ok: false,
        status: "critical",
        reasons: ["outbox_health_unavailable"],
      },
    });
  }
}
