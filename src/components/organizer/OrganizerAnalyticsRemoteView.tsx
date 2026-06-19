"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarRange, Download, RefreshCcw } from "lucide-react";
import FormattedPrice from "@/components/FormattedPrice";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { useAuth } from "@/context/AuthContext";
import { cabinetHeroClass, cabinetPanelClass } from "@/lib/cabinet-ui";
import {
  ANALYTICS_PERIOD_LABELS,
  type AnalyticsPeriod,
  type OrganizerAnalyticsServerReport,
} from "@/types/organizer-analytics";

type OrganizerAnalyticsApiResponse = {
  report?: OrganizerAnalyticsServerReport;
  error?: string;
};

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border bg-white p-4 shadow-card">
      <p className="text-sm text-slate">{label}</p>
      <div className="mt-2 font-heading text-2xl font-bold text-charcoal">{value}</div>
      {hint ? <p className="mt-1 text-xs text-slate">{hint}</p> : null}
    </div>
  );
}

function formatPct(value: number | null): string {
  if (value == null) return "—";
  return `${value}%`;
}

export default function OrganizerAnalyticsRemoteView() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [loading, setLoading] = useState(true);
  const [csvLoading, setCsvLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<OrganizerAnalyticsServerReport | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/organizer/analytics?period=${period}`);
      const json = (await response.json()) as OrganizerAnalyticsApiResponse;
      if (!response.ok) {
        setError(json.error ?? "Не удалось загрузить аналитику");
        return;
      }
      setReport(json.report ?? null);
    } catch {
      setError("Не удалось загрузить аналитику");
    } finally {
      setLoading(false);
    }
  }, [period]);

  const downloadCsv = useCallback(async () => {
    setCsvLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/organizer/analytics?period=${period}&format=csv`);
      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? "Не удалось скачать CSV");
        return;
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `organizer-analytics-${period}.csv`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Не удалось скачать CSV");
    } finally {
      setCsvLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <section className={cabinetHeroClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky/10 px-3 py-1 text-xs font-semibold text-sky">
              <BarChart3 className="h-3.5 w-3.5" aria-hidden />
              Аналитика
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold text-charcoal sm:text-3xl">
              Показатели бизнеса
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">
              Серверная сводка по выручке, воронке и лучшим турам на основе бронирований и
              платежей в Supabase.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <CalendarRange className="h-4 w-4 text-slate" aria-hidden />
              <NativeSelect
                value={period}
                onChange={(event) => setPeriod(event.target.value as AnalyticsPeriod)}
                className="border-0 bg-transparent py-0 pl-0 pr-8 text-sm font-medium"
              >
                {(Object.keys(ANALYTICS_PERIOD_LABELS) as AnalyticsPeriod[]).map((key) => (
                  <option key={key} value={key}>
                    {ANALYTICS_PERIOD_LABELS[key]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void loadAnalytics()}
              disabled={loading}
            >
              <RefreshCcw className="mr-1.5 h-4 w-4" aria-hidden />
              Обновить
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void downloadCsv()}
              disabled={csvLoading || loading}
            >
              <Download className="mr-1.5 h-4 w-4" aria-hidden />
              Скачать CSV
            </Button>
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-slate">Загрузка аналитики…</p> : null}

      {report ? (
        <>
          <section>
            <h2 className="font-heading text-lg font-bold text-charcoal">Ключевые показатели</h2>
            <p className="mt-1 text-sm text-slate">
              Данные за {report.period.label.toLowerCase()}.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <KpiCard label="Бронирования" value={report.summary.bookingsCount} />
              <KpiCard
                label="Выручка"
                value={<FormattedPrice priceUsd={report.summary.revenueUsd} />}
                hint="Подтверждённые и оплаченные бронирования"
              />
              <KpiCard label="Подтверждённые" value={report.summary.confirmedBookingsCount} />
              <KpiCard label="Оплаченные" value={report.summary.paidBookingsCount} />
              <KpiCard
                label="Средний чек"
                value={
                  report.summary.averageOrderValueUsd != null ? (
                    <FormattedPrice priceUsd={report.summary.averageOrderValueUsd} />
                  ) : (
                    "—"
                  )
                }
              />
              <KpiCard
                label="Клиенты"
                value={report.summary.uniqueCustomers}
                hint="Уникальные email"
              />
            </div>
          </section>

          <section className={cabinetPanelClass}>
            <h2 className="font-heading text-lg font-bold text-charcoal">Воронка конверсии</h2>
            <p className="mt-1 text-sm text-slate">
              Просмотры туров, старты бронирования, подтверждения и оплаты.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Просмотры" value={report.funnel.tourViews} />
              <KpiCard
                label="Старт бронирования"
                value={report.funnel.bookingStarts}
                hint={`Конверсия: ${formatPct(report.funnel.viewToStartPct)}`}
              />
              <KpiCard
                label="Подтверждение"
                value={report.funnel.confirmedBookings}
                hint={`Конверсия: ${formatPct(report.funnel.startToConfirmedPct)}`}
              />
              <KpiCard
                label="Оплата"
                value={report.funnel.paidBookings}
                hint={`Конверсия: ${formatPct(report.funnel.confirmedToPaidPct)}`}
              />
            </div>
          </section>

          <section className={cabinetPanelClass}>
            <h2 className="font-heading text-lg font-bold text-charcoal">Топ туров</h2>
            <p className="mt-1 text-sm text-slate">Сортировка по выручке за выбранный период.</p>
            {report.topTours.length === 0 ? (
              <p className="mt-4 text-sm text-slate">Пока нет данных по турам за этот период.</p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200">
                <table className="min-w-[760px] w-full text-left text-sm">
                  <thead className="bg-surface-muted/60 text-slate">
                    <tr>
                      <th className="px-4 py-3 font-medium">Тур</th>
                      <th className="px-4 py-3 font-medium">Бронирования</th>
                      <th className="px-4 py-3 font-medium">Подтверждены</th>
                      <th className="px-4 py-3 font-medium">Оплачены</th>
                      <th className="px-4 py-3 font-medium">Выручка</th>
                      <th className="px-4 py-3 font-medium">Конверсия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topTours.map((tour) => (
                      <tr key={tour.tourSlug} className="border-t border-gray-100">
                        <td className="px-4 py-3">
                          <Link
                            href={`/tours/${tour.tourSlug}`}
                            className="font-medium text-charcoal hover:text-sky"
                          >
                            {tour.tourTitle}
                          </Link>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{tour.bookingsCount}</td>
                        <td className="px-4 py-3 tabular-nums">{tour.confirmedBookingsCount}</td>
                        <td className="px-4 py-3 tabular-nums">{tour.paidBookingsCount}</td>
                        <td className="px-4 py-3">
                          <FormattedPrice priceUsd={tour.revenueUsd} className="font-medium" />
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {tour.conversionRatePct != null ? `${tour.conversionRatePct}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
