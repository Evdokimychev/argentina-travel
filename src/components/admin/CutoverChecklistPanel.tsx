"use client";

import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { ProductionReadinessSnapshot } from "@/lib/ops/production-readiness-types";

type CutoverStatus = "green" | "yellow" | "red";

type PublicHealthSnapshot = {
  ok: boolean;
  environment: {
    nodeEnv: string;
    deployEnv: string;
  };
  migrationVersion: string | null;
  checks: {
    database: {
      ok: boolean;
      skipped: boolean;
      error: string | null;
    };
    migrations: {
      latestId: string | null;
      fileCount: number;
    };
  };
};

type ChecklistItem = {
  id: string;
  title: string;
  detail: string;
  status: CutoverStatus;
};

type CutoverChecklistPanelProps = {
  health: PublicHealthSnapshot | null | undefined;
  readiness: ProductionReadinessSnapshot | null | undefined;
};

const STATUS_LABELS: Record<CutoverStatus, string> = {
  green: "Зелёный",
  yellow: "Жёлтый",
  red: "Красный",
};

const STATUS_CLASS: Record<CutoverStatus, string> = {
  green: "bg-emerald-50 text-emerald-800",
  yellow: "bg-amber-50 text-amber-800",
  red: "bg-red-50 text-red-700",
};

function rankStatus(status: CutoverStatus): number {
  if (status === "red") return 3;
  if (status === "yellow") return 2;
  return 1;
}

function maxStatus(values: CutoverStatus[]): CutoverStatus {
  return values.reduce<CutoverStatus>((acc, item) => (rankStatus(item) > rankStatus(acc) ? item : acc), "green");
}

function buildChecklist(
  health: PublicHealthSnapshot | null | undefined,
  readiness: ProductionReadinessSnapshot | null | undefined
): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  if (!health) {
    items.push({
      id: "health",
      title: "Публичная проверка состояния",
      status: "red",
      detail: "Нет данных /api/health",
    });
  } else if (health.ok && health.checks.database.ok) {
    items.push({
      id: "health",
      title: "Публичная проверка состояния",
      status: "green",
      detail: "База данных отвечает, маршрут доступен",
    });
  } else if (health.ok && health.checks.database.skipped) {
    items.push({
      id: "health",
      title: "Публичная проверка состояния",
      status: "yellow",
      detail: "Маршрут доступен, но проверка БД пропущена",
    });
  } else {
    items.push({
      id: "health",
      title: "Публичная проверка состояния",
      status: "red",
      detail: health.checks.database.error ?? "База данных недоступна",
    });
  }

  if (!health) {
    items.push({
      id: "migrations",
      title: "Версия миграций",
      status: "red",
      detail: "Не удалось определить migrationVersion",
    });
  } else {
    const { migrationVersion } = health;
    const latestId = health.checks.migrations.latestId;
    const fileCount = health.checks.migrations.fileCount;
    const matched = Boolean(migrationVersion && latestId && migrationVersion === latestId);
    const migrationStatus: CutoverStatus = matched ? "green" : migrationVersion ? "yellow" : "red";
    items.push({
      id: "migrations",
      title: "Версия миграций",
      status: migrationStatus,
      detail: matched
        ? `migrationVersion=${migrationVersion}, файлов миграций: ${fileCount}`
        : `migrationVersion=${migrationVersion ?? "—"}, latestId=${latestId ?? "—"}, файлов: ${fileCount}`,
    });
  }

  if (!readiness) {
    items.push({
      id: "readiness",
      title: "Готовность к продакшену",
      status: "yellow",
      detail: "Нет снимка: запустите npm run production-readiness",
    });
  } else {
    const readinessStatus: CutoverStatus =
      readiness.summary.fail > 0 ? "red" : readiness.summary.warn > 0 ? "yellow" : "green";
    items.push({
      id: "readiness",
      title: "Готовность к продакшену",
      status: readinessStatus,
      detail: `OK: ${readiness.summary.ok}, предупреждений: ${readiness.summary.warn}, ошибок: ${readiness.summary.fail}`,
    });
  }

  const healthEnv = health?.environment.deployEnv?.trim().toLowerCase();
  const readinessEnv = readiness?.environment.deployEnv?.trim().toLowerCase();
  const envAligned = healthEnv === "production" && readinessEnv === "production";
  const envStatus: CutoverStatus = envAligned
    ? "green"
    : healthEnv === "staging" || readinessEnv === "staging"
      ? "yellow"
      : "red";
  items.push({
    id: "env",
    title: "Окружение переключения",
    status: envStatus,
    detail: `health: ${healthEnv ?? "—"}, readiness: ${readinessEnv ?? "—"}`,
  });

  return items;
}

export default function CutoverChecklistPanel({ health, readiness }: CutoverChecklistPanelProps) {
  const checklist = buildChecklist(health, readiness);
  const overallStatus = maxStatus(checklist.map((item) => item.status));

  return (
    <section className={`${cabinetCardClass} space-y-4 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Чеклист cutover</h2>
          <p className="mt-1 text-sm text-slate">
            Статус рассчитывается по данным{" "}
            <code className="text-xs">/api/health</code> и{" "}
            <code className="text-xs">production-readiness</code>. Пошаговая инструкция:{" "}
            <code className="text-xs">docs/production-cutover-e81.md</code>.
          </p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${STATUS_CLASS[overallStatus]}`}>
          {STATUS_LABELS[overallStatus]}
        </span>
      </div>

      <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
        {checklist.map((item) => (
          <li key={item.id} className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-charcoal">{item.title}</p>
              <p className="mt-0.5 text-slate">{item.detail}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[item.status]}`}>
              {STATUS_LABELS[item.status]}
            </span>
          </li>
        ))}
      </ul>

      <div className="text-xs text-slate">
        Проверка после деплоя: <code>SMOKE_BASE_URL=https://www.goargentina.ru npm run production-smoke</code>
      </div>
    </section>
  );
}
