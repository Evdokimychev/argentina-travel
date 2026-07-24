import { NextResponse } from "next/server";
import { fetchPublicHealthSnapshot } from "@/lib/monitoring/health-public";

export async function GET() {
  const health = await fetchPublicHealthSnapshot();
  const status =
    health.status === "ok" ? "ok" : health.status === "degraded" ? "degraded" : "down";

  return NextResponse.json(
    {
      status,
      ok: health.ok,
      generatedAt: health.generatedAt,
      gitSha: health.gitSha,
      snapshotAgeSec: 0,
    },
    {
      status: health.ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
