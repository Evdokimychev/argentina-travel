"use client";

import { cabinetCardClass } from "@/lib/cabinet-ui";
import type {
  AnalyticsReadinessCheckItem,
  AnalyticsReadinessSnapshot,
} from "@/lib/ops/analytics-readiness-types";

const STATUS_LABELS: Record<AnalyticsReadinessCheckItem["status"], string> = {
  ok: "OK",
  warn: "Внимание",
  fail: "Ошибка",
  skip: "Пропуск",
};

const STATUS_CLASS: Record<AnalyticsReadinessCheckItem["status"], string> = {
  ok: "text-emerald-700 bg-emerald-50",
  warn: "text-amber-800 bg-amber-50",
  fail: "text-red-700 bg-red-50",
  skip: "text-slate-600 bg-slate-100",
};

const GTM_PUBLISH_CHECKLIST = [
  "Подключить рабочий контейнер аналитики к опубликованному сайту",
  "Добавить универсальную передачу событий в GA4",
  "Включить режим согласия для всех тегов аналитики",
  "GA4 Conversions: booking_submit, contact_form_submit, newsletter_subscribe",
  "Яндекс.Метрика: цели по событиям dataLayer",
  "Опубликовать изменения контейнера",
  "Проверить события после согласия посетителя на cookie",
] as const;

type AnalyticsReadinessPanelProps = {
  snapshot: AnalyticsReadinessSnapshot | null | undefined;
};

export default function AnalyticsReadinessPanel({ snapshot }: AnalyticsReadinessPanelProps) {
  if (!snapshot) return null;

  const { summary, checks, baseUrl, gtmEventsCount, conversionsRecommended } = snapshot;

  return (
    <section className={`${cabinetCardClass} space-y-4 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Аналитика и GTM</h2>
          <p className="mt-1 text-sm text-slate">
            Здесь видно, какие метрики уже подтверждены и что ещё нужно проверить перед публикацией.
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            snapshot.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {snapshot.ok ? "Проверки пройдены" : "Требует внимания"}
        </span>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate">Базовый URL проверки</dt>
          <dd className="mt-1 font-medium text-charcoal">{baseUrl}</dd>
        </div>
        <div>
          <dt className="text-slate">Последний прогон</dt>
          <dd className="mt-1 font-medium text-charcoal">{snapshot.ranAt}</dd>
        </div>
        <div>
          <dt className="text-slate">Подключённые события</dt>
          <dd className="mt-1 font-medium text-charcoal">
            {gtmEventsCount != null ? `${gtmEventsCount} событий` : "—"}
          </dd>
        </div>
      </dl>

      {conversionsRecommended?.length ? (
        <div className="rounded-lg border border-border/60 bg-surface-elevated/50 px-3 py-2.5 text-sm">
          <p className="font-medium text-charcoal">Рекомендуемые конверсии GA4 / цели Метрики</p>
          <p className="mt-1 text-slate">{conversionsRecommended.join(", ")}</p>
        </div>
      ) : null}

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

      <details className="rounded-lg border border-border/60 px-3 py-2.5 text-sm">
        <summary className="cursor-pointer font-medium text-charcoal">
          Чек-лист публикации GTM (вручную)
        </summary>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-slate">
          {GTM_PUBLISH_CHECKLIST.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-slate">
          Подключение внешних кабинетов выполняется владельцем аккаунтов. После этого состояние
          автоматически появится в админке.
        </p>
      </details>
    </section>
  );
}
