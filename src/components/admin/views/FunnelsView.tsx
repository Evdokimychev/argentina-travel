"use client";

import { useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import AdminFunnelChart from "@/components/admin/AdminFunnelChart";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass, cabinetStatCardClass } from "@/lib/cabinet-ui";
import type {
  AdminAnalyticsFunnelsPayload,
  AnalyticsFunnelStepId,
  AnalyticsExportType,
  AnalyticsPeriod,
} from "@/types/admin-analytics";
import {
  ANALYTICS_EXPORT_TYPE_LABELS,
  ANALYTICS_PERIOD_LABELS,
} from "@/types/admin-analytics";

type FunnelsResponse = { funnels?: AdminAnalyticsFunnelsPayload };

const EXPORT_TYPES: AnalyticsExportType[] = ["bookings", "reviews", "payments"];
const METRIC_SOURCE_LABELS: Record<string, string> = {
  controlled_analytics_events: "Проверенные события сайта",
  bookings: "Заявки и бронирования",
  payment_ledger: "Журнал проведённых оплат",
  published_reviews: "Опубликованные отзывы",
};
const FUNNEL_ORDER: AnalyticsFunnelStepId[] = [
  "tour_view",
  "booking_started",
  "confirmed",
  "paid",
  "review",
];

function FunnelSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Загрузка воронки">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function CohortSkeleton() {
  return (
    <div className="mt-4 flex items-end gap-2" style={{ minHeight: 140 }} aria-busy="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-24 flex-1 rounded-t-lg" />
      ))}
    </div>
  );
}

export default function FunnelsView() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const { data, loading, error } = useAdminApi<FunnelsResponse>(
    `/api/admin/analytics/funnels?period=${period}`
  );
  const funnels = data?.funnels;
  const hasFunnelData =
    funnels?.meta.trustedForKpi === true &&
    (funnels?.funnel ?? []).some((step) => step.count > 0);
  const maxCohort = Math.max(1, ...(funnels?.cohorts ?? []).map((c) => c.bookings));

  return (
    <CapabilityGate capability="analytics.view">
      <AdminPageShell>
        <AdminPageHeader
          title="Воронки и когорты"
          subtitle="Путь пользователя от просмотра тура до отзыва"
          actions={
            <NativeSelect
              value={period}
              onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
              className="w-40"
            >
              {(Object.keys(ANALYTICS_PERIOD_LABELS) as AnalyticsPeriod[]).map((key) => (
                <option key={key} value={key}>
                  {ANALYTICS_PERIOD_LABELS[key]}
                </option>
              ))}
            </NativeSelect>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {funnels ? (
          <p className="text-sm text-slate">
            {funnels.periodStart
              ? `Период: с ${formatAdminWhen(funnels.periodStart)}`
              : "Период: всё время"}
            {" · "}
            Обновлено {formatAdminWhen(funnels.generatedAt)}
            {!funnels.meta.trustedForKpi ? (
              <span className="ml-1 text-amber-700">
                · Воронка скрыта: нет достоверных данных
              </span>
            ) : null}
          </p>
        ) : loading ? (
          <Skeleton className="h-4 w-80 max-w-full" />
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className={`${cabinetCardClass} p-5`}>
            <h2 className="font-heading text-lg font-bold text-charcoal">Воронка бронирования</h2>
            <p className="mt-1 text-sm text-slate">
              Просмотр → заявка → подтверждение → оплата → отзыв
            </p>

            {loading ? (
              <div className="mt-6">
                <FunnelSkeleton />
              </div>
            ) : funnels && !funnels.meta.trustedForKpi ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <p className="text-sm font-semibold text-amber-950">Нет достоверных данных</p>
                <p className="mt-2 text-sm text-amber-900">
                  {funnels.meta.reason ??
                    "Воронка появится после проверки источника событий. Заявки не используются как замена просмотров."}
                </p>
              </div>
            ) : hasFunnelData && funnels ? (
              <div className="mt-6">
                <AdminFunnelChart steps={funnels.funnel} />
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-8 text-center">
                <p className="text-sm font-medium text-charcoal">Нет данных за период</p>
                <p className="mt-2 text-sm text-slate">
                  Когда появятся просмотры туров, заявки и отзывы, воронка заполнится автоматически.
                </p>
              </div>
            )}

            {funnels ? (
              <div className="mt-5 grid gap-2 sm:grid-cols-2" aria-label="Источники показателей">
                {FUNNEL_ORDER.map((id) => {
                  const metric = funnels.metrics[id];
                  return (
                    <div key={id} className="rounded-xl border border-gray-100 bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-charcoal">
                          {metric.source === "controlled_analytics_events"
                            ? "Просмотры"
                            : metric.source === "payment_ledger"
                              ? "Оплаты"
                              : metric.source === "published_reviews"
                                ? "Отзывы"
                                : id === "confirmed"
                                  ? "Подтверждения"
                                  : "Заявки"}
                        </p>
                        <span className={`text-xs font-medium ${
                          metric.status === "available" ? "text-emerald-700" : "text-amber-700"
                        }`}>
                          {metric.status === "available" ? "Подтверждено" : "Недоступно"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate">
                        {METRIC_SOURCE_LABELS[metric.source] ?? metric.source}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className={`${cabinetCardClass} p-5`}>
            <h2 className="font-heading text-lg font-bold text-charcoal">Партнёрский handoff</h2>
            <p className="mt-1 text-sm text-slate">
              Карточка → detail → старт бронирования → переход к партнёру. Не считается оплатой.
            </p>
            {loading ? (
              <div className="mt-6">
                <FunnelSkeleton />
              </div>
            ) : funnels?.partnerHandoff ? (
              <div className="mt-6 space-y-3">
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  {funnels.partnerHandoff.reason}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {funnels.partnerHandoff.steps.map((step) => (
                    <div key={step.id} className="rounded-xl border border-gray-100 bg-white p-3">
                      <p className="text-xs font-medium text-charcoal">{step.label}</p>
                      <p className="mt-1 font-heading text-xl font-bold text-charcoal">
                        {step.count == null ? "—" : step.count}
                      </p>
                      <p className={`mt-1 text-xs ${
                        step.status === "available" ? "text-emerald-700" : "text-amber-700"
                      }`}>
                        {step.status === "available" ? "Проверенный ingest" : "Недоступно"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className={`${cabinetCardClass} p-5`}>
            <h2 className="font-heading text-lg font-bold text-charcoal">Когорты по месяцам</h2>
            <p className="mt-1 text-sm text-slate">Новые бронирования по месяцам регистрации заявки</p>

            {loading ? (
              <CohortSkeleton />
            ) : funnels?.cohortsMetric.status === "unavailable" ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <p className="text-sm font-semibold text-amber-950">Данные по месяцам недоступны</p>
                <p className="mt-2 text-sm text-amber-900">
                  Нулевые значения не показываются, пока источник не ответит корректно.
                </p>
              </div>
            ) : funnels && funnels.cohorts.some((c) => c.bookings > 0) ? (
              <>
                <div className="mt-6 flex items-end gap-2" style={{ minHeight: 140 }}>
                  {funnels.cohorts.map((cohort) => {
                    const heightPct = Math.round((cohort.bookings / maxCohort) * 100);
                    return (
                      <div
                        key={cohort.month}
                        className="group flex flex-1 flex-col items-center justify-end gap-1"
                        title={`${cohort.label}: ${cohort.bookings} бронирований`}
                      >
                        <span className="text-[10px] text-slate opacity-0 transition-opacity group-hover:opacity-100">
                          {cohort.bookings || ""}
                        </span>
                        <div
                          className="w-full min-w-[8px] rounded-t bg-violet-400/80 transition-colors group-hover:bg-violet-500"
                          style={{
                            height: `${Math.max(cohort.bookings > 0 ? 12 : 4, heightPct)}%`,
                            minHeight: cohort.bookings > 0 ? "0.75rem" : "0.25rem",
                          }}
                        />
                        <span className="text-center text-[9px] leading-tight text-slate">
                          {cohort.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-slate">
                  На графике показано число новых заявок по месяцам. Повторные покупки будут
                  рассчитаны после накопления достаточного количества данных.
                </p>
              </>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-8 text-center">
                <p className="text-sm font-medium text-charcoal">Нет бронирований за период</p>
                <p className="mt-2 text-sm text-slate">Выберите другой период или дождитесь первых заявок.</p>
              </div>
            )}
          </div>
        </section>

        <section className={`${cabinetCardClass} p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-bold text-charcoal">Экспорт данных</h2>
              <p className="mt-1 text-sm text-slate">
                CSV за выбранный период ({ANALYTICS_PERIOD_LABELS[period].toLowerCase()})
              </p>
            </div>
            <Link href="/admin/analytics" className="text-sm text-sky hover:underline">
              ← Сводка аналитики
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {EXPORT_TYPES.map((type) => (
              <div key={type} className={cabinetStatCardClass}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate">
                  {ANALYTICS_EXPORT_TYPE_LABELS[type]}
                </p>
                <a
                  href={`/api/admin/analytics/export?type=${type}&period=${period}`}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Скачать CSV
                </a>
              </div>
            ))}
          </div>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
