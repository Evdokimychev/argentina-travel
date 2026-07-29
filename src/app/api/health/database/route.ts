import { NextResponse } from "next/server";
import { fetchPublicHealthSnapshot } from "@/lib/monitoring/health-public";

export async function GET() {
  const health = await fetchPublicHealthSnapshot({ includeSearchIndexCount: false });
  const serviceAvailable = health.checks.database.ok || health.checks.postgresDirect.ok;

  return NextResponse.json(
    {
      status: health.status,
      ok: health.ok,
      serviceAvailable,
      generatedAt: health.generatedAt,
      checks: {
        rest: {
          status: health.checks.database.ok
            ? "ok"
            : health.checks.database.skipped
              ? "skipped"
              : "down",
          latencyMs: health.checks.database.latencyMs,
        },
        postgresDirect: {
          status: health.checks.postgresDirect.ok
            ? "ok"
            : health.checks.postgresDirect.skipped
              ? "skipped"
              : "down",
          latencyMs: health.checks.postgresDirect.latencyMs,
          tripsterCount: health.checks.postgresDirect.tripsterCount,
        },
      },
    },
    {
      status: health.ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
