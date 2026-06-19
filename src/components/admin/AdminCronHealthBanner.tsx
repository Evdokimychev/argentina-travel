"use client";

import Link from "next/link";
import { useAdminApi } from "@/hooks/useAdminApi";

type CronHealthResponse = {
  ok: boolean;
  status: "ok" | "degraded";
  generatedAt: string;
  failingRoutes: string[];
  latestByRoute: Record<
    string,
    {
      ranAt: string;
      ok: boolean;
      message: string;
    }
  >;
};

export default function AdminCronHealthBanner() {
  const { data, loading, error } = useAdminApi<CronHealthResponse>(
    "/api/cron/ops/health-report"
  );

  if (loading || error || !data || data.ok) return null;

  const failingRoutes = data.failingRoutes;
  const topRoute = failingRoutes[0];
  const topFailure = topRoute ? data.latestByRoute[topRoute] : null;

  return (
    <section className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-medium">
        Обнаружена деградация cron: {failingRoutes.length}{" "}
        {failingRoutes.length === 1 ? "маршрут" : "маршрутов"} с ошибкой.
      </p>
      {topRoute && topFailure ? (
        <p className="mt-1 text-amber-800">
          Последний сбой: <code className="text-xs">{topRoute}</code> — {topFailure.ranAt}
          {" · "}
          {topFailure.message}
        </p>
      ) : null}
      <Link href="/admin/system/settings" className="mt-2 inline-block text-xs font-medium text-amber-900 underline">
        Открыть раздел эксплуатации
      </Link>
    </section>
  );
}
