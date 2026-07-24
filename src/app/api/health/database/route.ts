import { NextResponse } from "next/server";
import { fetchPublicHealthSnapshot } from "@/lib/monitoring/health-public";

export async function GET() {
  const health = await fetchPublicHealthSnapshot({ includeSearchIndexCount: false });
  const databaseOk = health.checks.database.ok || health.checks.postgresDirect.ok;
  const status = databaseOk
    ? health.checks.database.ok && health.checks.postgresDirect.ok
      ? "ok"
      : "degraded"
    : "down";

  return NextResponse.json(
    {
      status,
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
      status: status === "down" ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
