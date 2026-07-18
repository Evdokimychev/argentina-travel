"use client";

import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { ProductionReadinessSnapshot, ReadinessCheckItem } from "@/lib/ops/production-readiness-types";

const STATUS_LABELS: Record<ReadinessCheckItem["status"], string> = {
  ok: "Подтверждено",
  warn: "Внимание",
  fail: "Блокер",
  skip: "Не проверено",
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
  const recoveryCheck = checks.find((check) => check.id === "recovery:backup-restore");
  const stateMeta = {
    blocked: { label: "Есть блокеры", className: "bg-red-50 text-red-700" },
    needs_verification: { label: "Нужны проверки", className: "bg-amber-50 text-amber-800" },
    local_passed: { label: "Локально пройдено", className: "bg-sky/10 text-sky-ink" },
    ready_to_publish: { label: "Готово к публикации", className: "bg-emerald-50 text-emerald-800" },
  }[snapshot.state];

  return (
    <section className={`${cabinetCardClass} space-y-4 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Готовность к публикации</h2>
          <p className="mt-1 text-sm text-slate">
            Здесь разделены локальная проверка, внешние подтверждения и готовность конкретного релиза.
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${stateMeta.className}`}
        >
          {stateMeta.label}
        </span>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate">Режим приложения</dt>
          <dd className="mt-1 font-medium text-charcoal">{environment.nodeEnv}</dd>
        </div>
        <div>
          <dt className="text-slate">Среда публикации</dt>
          <dd className="mt-1 font-medium text-charcoal">{environment.deployEnv}</dd>
        </div>
        <div>
          <dt className="text-slate">Последняя полная проверка</dt>
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

      {recoveryCheck ? (
        <div className={`rounded-xl p-4 ${STATUS_CLASS[recoveryCheck.status]}`}>
          <p className="text-sm font-semibold">Защита данных перед публикацией</p>
          <p className="mt-1 text-sm">{recoveryCheck.message}</p>
        </div>
      ) : null}

      <details className="rounded-lg border border-border/60">
        <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium text-charcoal">
          Технические подробности ({checks.length})
        </summary>
        <ul className="divide-y divide-border/60 border-t border-border/60">
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
      </details>
    </section>
  );
}
