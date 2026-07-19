"use client";

import Link from "next/link";
import { useAdminApi } from "@/hooks/useAdminApi";

type CronHealthResponse = {
  ok: boolean;
  status: "ok" | "degraded";
  generatedAt: string;
  source: "file" | "memory" | "none";
  dataAvailable: boolean;
  durable: boolean;
  failingRoutes: string[];
  latestByRoute: Record<
    string,
    {
      ranAt: string;
      ok: boolean;
      message: string;
    }
  >;
  outbox?: {
    ok: boolean;
    status: "ok" | "degraded" | "critical";
    pending?: number;
    failed?: number;
    dead?: number;
    oldestQueuedAgeMinutes?: number | null;
    reasons: string[];
  };
};

export default function AdminCronHealthBanner() {
  const { data, loading, error } = useAdminApi<CronHealthResponse>(
    "/api/cron/ops/health-report"
  );

  if (loading) return null;

  if (error || !data) {
    return (
      <section className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        <p className="font-medium">Данные эксплуатации сейчас недоступны.</p>
        <p className="mt-1 text-red-800">
          Нельзя подтвердить состояние cron и очереди писем. Проверьте health API и Sentry.
        </p>
      </section>
    );
  }

  if (data.ok) return null;

  const failingRoutes = data.failingRoutes;
  const topRoute = failingRoutes[0];
  const topFailure = topRoute ? data.latestByRoute[topRoute] : null;
  const cronHeadline = !data.dataAvailable
    ? "Нет достоверного журнала запусков cron."
    : !data.durable
      ? "Журнал cron временный и может потеряться при перезапуске."
      : `Обнаружена деградация cron: ${failingRoutes.length} ${failingRoutes.length === 1 ? "маршрут" : "маршрутов"} с ошибкой.`;

  return (
    <section className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-medium">
        {cronHeadline}
      </p>
      {topRoute && topFailure ? (
        <p className="mt-1 text-amber-800">
          Последний сбой: <code className="text-xs">{topRoute}</code> — {topFailure.ranAt}
          {" · "}
          {topFailure.message}
        </p>
      ) : null}
      {data.outbox && !data.outbox.ok ? (
        <p className="mt-1 text-amber-800">
          Очередь писем: {data.outbox.status}
          {typeof data.outbox.pending === "number" ? ` · pending ${data.outbox.pending}` : ""}
          {typeof data.outbox.failed === "number" ? ` · failed ${data.outbox.failed}` : ""}
          {typeof data.outbox.dead === "number" ? ` · dead ${data.outbox.dead}` : ""}
        </p>
      ) : null}
      <Link href="/admin/system/settings" className="mt-2 inline-block text-xs font-medium text-amber-900 underline">
        Открыть раздел эксплуатации
      </Link>
    </section>
  );
}
