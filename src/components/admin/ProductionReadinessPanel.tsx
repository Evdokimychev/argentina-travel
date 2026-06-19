"use client";

import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { ProductionReadinessSnapshot, ReadinessCheckItem } from "@/lib/ops/production-readiness-types";

const STATUS_LABELS: Record<ReadinessCheckItem["status"], string> = {
  ok: "OK",
  warn: "Внимание",
  fail: "Ошибка",
  skip: "Пропуск",
};

const STATUS_CLASS: Record<ReadinessCheckItem["status"], string> = {
  ok: "text-emerald-700 bg-emerald-50",
  warn: "text-amber-800 bg-amber-50",
  fail: "text-red-700 bg-red-50",
  skip: "text-slate-600 bg-slate-100",
};

type ProductionReadinessPanelProps = {
  snapshot: ProductionReadinessSnapshot | null | undefined;
};

export default function ProductionReadinessPanel({ snapshot }: ProductionReadinessPanelProps) {
  if (!snapshot) return null;

  const { environment, summary, checks, scriptReport } = snapshot;

  return (
    <section className={`${cabinetCardClass} space-y-4 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Готовность к production</h2>
          <p className="mt-1 text-sm text-slate">
            Только чтение. Полный прогон:{" "}
            <code className="text-xs">npm run production-readiness</code>. См.{" "}
            <code className="text-xs">docs/production-cutover-e72.md</code>.
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            snapshot.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {snapshot.ok ? "Готово" : "Есть блокеры"}
        </span>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate">NODE_ENV</dt>
          <dd className="mt-1 font-medium text-charcoal">{environment.nodeEnv}</dd>
        </div>
        <div>
          <dt className="text-slate">DEPLOY_ENV</dt>
          <dd className="mt-1 font-medium text-charcoal">{environment.deployEnv}</dd>
        </div>
        <div>
          <dt className="text-slate">Последний отчёт скрипта</dt>
          <dd className="mt-1 font-medium text-charcoal">
            {scriptReport?.ranAt ?? "Не запускался"}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800">OK: {summary.ok}</span>
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">
          Внимание: {summary.warn}
        </span>
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-700">Ошибки: {summary.fail}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
          Пропуск: {summary.skip}
        </span>
      </div>

      <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
        {checks.map((check) => (
          <li key={check.id} className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-charcoal">{check.label}</p>
              <p className="mt-0.5 text-slate">{check.message}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[check.status]}`}
            >
              {STATUS_LABELS[check.status]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
