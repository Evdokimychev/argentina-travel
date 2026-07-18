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
  green: "Пройдено",
  yellow: "Нужна проверка",
  red: "Блокер",
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

export function buildCutoverChecklist(
  health: PublicHealthSnapshot | null | undefined,
  readiness: ProductionReadinessSnapshot | null | undefined
): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  if (!health) {
    items.push({
      id: "health",
      title: "Публичная проверка состояния",
      status: "red",
      detail: "Нет данных о состоянии опубликованного сайта",
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
      title: "Обновление базы данных",
      status: "red",
      detail: "Не удалось подтвердить версию базы данных",
    });
  } else {
    const { migrationVersion } = health;
    const latestId = health.checks.migrations.latestId;
    const fileCount = health.checks.migrations.fileCount;
    const matched = Boolean(migrationVersion && latestId && migrationVersion === latestId);
    const migrationStatus: CutoverStatus = matched ? "green" : migrationVersion ? "yellow" : "red";
    items.push({
      id: "migrations",
      title: "Обновление базы данных",
      status: migrationStatus,
      detail: matched
        ? `Установлена актуальная версия (${fileCount} обновлений)`
        : migrationVersion
          ? "Версия базы данных отличается от версии приложения"
          : "Версия базы данных не подтверждена",
    });
  }

  if (!readiness) {
    items.push({
      id: "readiness",
      title: "Готовность к публикации",
      status: "yellow",
      detail: "Полная проверка текущего релиза ещё не выполнена",
    });
  } else {
    const readinessStatus: CutoverStatus = readiness.state === "ready_to_publish"
      ? "green"
      : readiness.state === "blocked"
        ? "red"
        : "yellow";
    items.push({
      id: "readiness",
      title: "Готовность к публикации",
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
    detail: envAligned
      ? "Обе проверки относятся к опубликованному сайту"
      : envStatus === "yellow"
        ? "Проверяется тестовая среда, а не окончательная публикация"
        : "Среда публикации не подтверждена",
  });

  return items;
}

export default function CutoverChecklistPanel({ health, readiness }: CutoverChecklistPanelProps) {
  const checklist = buildCutoverChecklist(health, readiness);
  const overallStatus = maxStatus(checklist.map((item) => item.status));

  return (
    <section className={`${cabinetCardClass} space-y-4 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Проверка перед публикацией</h2>
          <p className="mt-1 text-sm text-slate">
            Сайт можно публиковать только после подтверждения приложения, базы данных и текущей версии.
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
        После публикации система должна повторно проверить ключевые страницы и сценарии бронирования.
      </div>
    </section>
  );
}
