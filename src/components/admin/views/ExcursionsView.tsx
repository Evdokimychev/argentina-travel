"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AdminTrendChart from "@/components/admin/AdminTrendChart";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { NativeSelect } from "@/components/ui/native-select";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import {
  hasAffiseHistoryData,
  historyHasClicksData,
} from "@/lib/youtravel/affise-snapshots";

type ExcursionAdminStats = {
  experiences: number;
  cities: number;
  reviews: number;
  clicksTotal: number;
  clicksLast7Days: number;
  withPartnerUrl: number;
  lastSync: {
    id: string;
    status: string;
    startedAt: string;
    finishedAt: string | null;
    experiencesSynced: number;
    citiesSynced: number;
    errorMessage: string | null;
  } | null;
  topClicks: Array<{ slug: string; count: number }>;
  recentClicks: Array<{
    id: string;
    experienceSlug: string;
    createdAt: string;
    referer: string | null;
  }>;
  tripsterBookingRequestsTotal: number;
  tripsterBookingRequestsByStatus: Record<string, number>;
  recentTripsterBookingRequests: Array<{
    id: string;
    experienceSlug: string;
    experienceTitle: string;
    eventDate: string;
    eventTime: string;
    personsCount: number;
    customerName: string;
    customerEmail: string;
    tripsterStatus: string | null;
    tripsterOrderUrl: string | null;
    createdAt: string;
  }>;
  youtravelBookingRequestsTotal: number;
  youtravelBookingRequestsByStatus: Record<string, number>;
  recentYouTravelBookingRequests: Array<{
    id: string;
    tourSlug: string;
    tourTitle: string;
    startDate: string;
    endDate: string | null;
    personsCount: number;
    customerName: string;
    customerEmail: string;
    youtravelStatus: string | null;
    youtravelOrderUrl: string | null;
    createdAt: string;
  }>;
};

type ExcursionsResponse = { stats?: ExcursionAdminStats };

type AffiseHistoryPoint = {
  date: string;
  conversions: number;
  clicks: number | null;
};

type AffiseAdminStats = {
  configured: boolean;
  error?: string;
  last7Days?: { conversions: number; clicks: number | null };
  last30Days?: { conversions: number; clicks: number | null };
  history?: {
    points7: AffiseHistoryPoint[];
    points30: AffiseHistoryPoint[];
    points90: AffiseHistoryPoint[];
  };
  alert?: {
    kind: "conversion_drop";
    previous7: number;
    last7: number;
    dropPercent: number;
  };
};

type AffiseChartPeriod = "7" | "30" | "90";

function resolveAffiseChartPoints(
  history: AffiseAdminStats["history"],
  period: AffiseChartPeriod
): AffiseHistoryPoint[] {
  if (!history) return [];
  if (period === "7") return history.points7;
  if (period === "30") return history.points30;
  return history.points90;
}

export default function ExcursionsView() {
  const [affisePeriod, setAffisePeriod] = useState<AffiseChartPeriod>("30");
  const { data, loading, error, refresh } = useAdminApi<ExcursionsResponse>("/api/admin/excursions");
  const {
    data: affiseData,
    loading: affiseLoading,
    error: affiseError,
    refresh: refreshAffise,
  } = useAdminApi<AffiseAdminStats>("/api/admin/youtravel/affise");
  const stats = data?.stats ?? null;

  const affiseChartPoints = useMemo(
    () => resolveAffiseChartPoints(affiseData?.history, affisePeriod),
    [affiseData?.history, affisePeriod]
  );
  const affiseHistoryHasData = hasAffiseHistoryData(affiseChartPoints);
  const affiseClicksChartVisible = historyHasClicksData(affiseChartPoints);
  const affisePeriodLabel =
    affisePeriod === "7" ? "7 дней" : affisePeriod === "30" ? "30 дней" : "90 дней";

  return (
    <CapabilityGate capability="marketplace.excursions">
      <AdminPageShell>
        <AdminPageHeader
          title="Экскурсии"
          subtitle="Tripster и партнёрская аналитика"
          actions={
            <Button
              variant="outline"
              onClick={() => {
                void refresh();
                void refreshAffise();
              }}
              disabled={loading || affiseLoading}
            >
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <section className={`${cabinetCardClass} p-5 text-sm`}>
          <h2 className="font-heading text-lg font-bold text-charcoal">Affise (YouTravel.me)</h2>
          {affiseLoading ? (
            <p className="mt-3 text-slate">Загрузка статистики…</p>
          ) : affiseError ? (
            <p className="mt-3 text-red-600">{affiseError}</p>
          ) : affiseData?.configured === false ? (
            <p className="mt-3 text-slate">
              Укажите <code className="text-xs">YOUTRAVEL_AFFISE_API_KEY</code> в окружении сервера,
              чтобы видеть конверсии партнёрской программы.
            </p>
          ) : (
            <div className="mt-3 space-y-4">
              {affiseData?.alert ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Конверсии упали на {affiseData.alert.dropPercent}% за последние 7 дней (
                  {affiseData.alert.last7} против {affiseData.alert.previous7} в предыдущем периоде).
                </p>
              ) : null}

              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-slate">Конверсии за 7 дней</dt>
                  <dd className="mt-1 font-heading text-2xl font-bold text-charcoal">
                    {affiseData?.last7Days?.conversions ?? 0}
                  </dd>
                  {affiseData?.last7Days?.clicks != null ? (
                    <p className="mt-1 text-xs text-slate">Клики: {affiseData.last7Days.clicks}</p>
                  ) : null}
                </div>
                <div>
                  <dt className="text-slate">Конверсии за 30 дней</dt>
                  <dd className="mt-1 font-heading text-2xl font-bold text-charcoal">
                    {affiseData?.last30Days?.conversions ?? 0}
                  </dd>
                  {affiseData?.last30Days?.clicks != null ? (
                    <p className="mt-1 text-xs text-slate">Клики: {affiseData.last30Days.clicks}</p>
                  ) : null}
                </div>
                {affiseData?.error ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-amber-800">{affiseData.error}</p>
                  </div>
                ) : null}
              </dl>

              {!affiseHistoryHasData ? (
                <p className="text-slate">Данные обновляются ежедневно.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-slate">
                      <span>Период графика</span>
                      <NativeSelect
                        value={affisePeriod}
                        onChange={(event) => setAffisePeriod(event.target.value as AffiseChartPeriod)}
                        className="min-w-[8rem]"
                      >
                        <option value="7">7 дней</option>
                        <option value="30">30 дней</option>
                        <option value="90">90 дней</option>
                      </NativeSelect>
                    </label>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <AdminTrendChart
                      title={`Конверсии за ${affisePeriodLabel}`}
                      points={affiseChartPoints.map((point) => ({
                        date: point.date,
                        count: point.conversions,
                      }))}
                    />
                    {affiseClicksChartVisible ? (
                      <AdminTrendChart
                        title={`Клики за ${affisePeriodLabel}`}
                        points={affiseChartPoints.map((point) => ({
                          date: point.date,
                          count: point.clicks ?? 0,
                        }))}
                      />
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {!stats ? (
          <section className={`${cabinetCardClass} px-5 py-8 text-sm text-slate`}>
            {loading
              ? "Загрузка…"
              : "Нет данных по экскурсиям. Проверьте миграции Supabase и синхронизацию Tripster."}
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Экскурсии", value: stats.experiences },
                { label: "Города", value: stats.cities },
                { label: "Отзывы", value: stats.reviews },
                { label: "Клики (7 дн.)", value: stats.clicksLast7Days },
                { label: "Заявки Tripster", value: stats.tripsterBookingRequestsTotal },
                { label: "Заявки YouTravel", value: stats.youtravelBookingRequestsTotal ?? 0 },
              ].map((item) => (
                <div key={item.label} className={`${cabinetCardClass} p-5`}>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate">{item.label}</p>
                  <p className="mt-2 font-heading text-2xl font-bold text-charcoal">{item.value}</p>
                </div>
              ))}
            </section>

            <section className={`${cabinetCardClass} p-5 text-sm`}>
              <h2 className="font-heading text-lg font-bold text-charcoal">Синхронизация</h2>
              {stats.lastSync ? (
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-slate">Статус</dt>
                    <dd className="font-medium text-charcoal">{stats.lastSync.status}</dd>
                  </div>
                  <div>
                    <dt className="text-slate">Старт</dt>
                    <dd className="font-medium text-charcoal">
                      {formatAdminWhen(stats.lastSync.startedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate">Экскурсий / городов</dt>
                    <dd className="font-medium text-charcoal">
                      {stats.lastSync.experiencesSynced} / {stats.lastSync.citiesSynced}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate">Partner URL</dt>
                    <dd className="font-medium text-charcoal">
                      {stats.withPartnerUrl} / {stats.experiences}
                    </dd>
                  </div>
                  {stats.lastSync.errorMessage ? (
                    <div className="sm:col-span-2">
                      <dt className="text-slate">Ошибка</dt>
                      <dd className="text-red-600">{stats.lastSync.errorMessage}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <p className="mt-3 text-slate">Синхронизация ещё не запускалась.</p>
              )}
              <p className="mt-4 text-slate">Всего кликов по партнёрским ссылкам: {stats.clicksTotal}</p>
            </section>

            <section className={`${cabinetCardClass} overflow-hidden`}>
              <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
                Топ кликов
              </h2>
              <ul className="divide-y divide-gray-100">
                {stats.topClicks.length === 0 ? (
                  <li className="px-5 py-8 text-sm text-slate">Пока нет кликов</li>
                ) : (
                  stats.topClicks.map((row) => (
                    <li
                      key={row.slug}
                      className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
                    >
                      <Link href={`/excursions/${row.slug}`} className="text-sky hover:underline">
                        {row.slug}
                      </Link>
                      <span className="font-medium text-charcoal">{row.count}</span>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className={`${cabinetCardClass} overflow-hidden`}>
              <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
                Заявки Tripster
              </h2>
              {Object.keys(stats.tripsterBookingRequestsByStatus).length > 0 ? (
                <div className="flex flex-wrap gap-2 border-b border-gray-100 px-5 py-3">
                  {Object.entries(stats.tripsterBookingRequestsByStatus)
                    .sort(([left], [right]) => left.localeCompare(right))
                    .map(([status, count]) => (
                      <span
                        key={status}
                        className="rounded-full bg-sky/10 px-2.5 py-1 text-xs font-medium text-sky"
                      >
                        {status}: {count}
                      </span>
                    ))}
                </div>
              ) : null}
              <ul className="divide-y divide-gray-100">
                {stats.recentTripsterBookingRequests.length === 0 ? (
                  <li className="px-5 py-8 text-sm text-slate">Заявок Tripster пока нет</li>
                ) : (
                  stats.recentTripsterBookingRequests.map((request) => (
                    <li key={request.id} className="space-y-1 px-5 py-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/excursions/${request.experienceSlug}`}
                            className="font-medium text-sky hover:underline"
                          >
                            {request.experienceTitle}
                          </Link>
                          <p className="text-xs text-slate">
                            {request.eventDate} · {request.eventTime} · {request.personsCount} чел.
                          </p>
                        </div>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-charcoal">
                          {request.tripsterStatus ?? "unknown"}
                        </span>
                      </div>
                      <p className="text-xs text-slate">
                        {request.customerName} · {request.customerEmail}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate">
                        <span>{formatAdminWhen(request.createdAt)}</span>
                        {request.tripsterOrderUrl ? (
                          <a
                            href={request.tripsterOrderUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky hover:underline"
                          >
                            Открыть заказ
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className={`${cabinetCardClass} overflow-hidden`}>
              <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
                Заявки YouTravel.me
              </h2>
              {Object.keys(stats.youtravelBookingRequestsByStatus ?? {}).length > 0 ? (
                <div className="flex flex-wrap gap-2 border-b border-gray-100 px-5 py-3">
                  {Object.entries(stats.youtravelBookingRequestsByStatus ?? {})
                    .sort(([left], [right]) => left.localeCompare(right))
                    .map(([status, count]) => (
                      <span
                        key={status}
                        className="rounded-full bg-sky/10 px-2.5 py-1 text-xs font-medium text-sky"
                      >
                        {status}: {count}
                      </span>
                    ))}
                </div>
              ) : null}
              <ul className="divide-y divide-gray-100">
                {(stats.recentYouTravelBookingRequests ?? []).length === 0 ? (
                  <li className="px-5 py-8 text-sm text-slate">Заявок YouTravel.me пока нет</li>
                ) : (
                  (stats.recentYouTravelBookingRequests ?? []).map((request) => (
                    <li key={request.id} className="space-y-1 px-5 py-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/tours/${request.tourSlug}`}
                            className="font-medium text-sky hover:underline"
                          >
                            {request.tourTitle}
                          </Link>
                          <p className="text-xs text-slate">
                            {request.startDate}
                            {request.endDate ? ` — ${request.endDate}` : ""} · {request.personsCount} чел.
                          </p>
                        </div>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-charcoal">
                          {request.youtravelStatus ?? "unknown"}
                        </span>
                      </div>
                      <p className="text-xs text-slate">
                        {request.customerName} · {request.customerEmail}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate">
                        <span>{formatAdminWhen(request.createdAt)}</span>
                        {request.youtravelOrderUrl ? (
                          <a
                            href={request.youtravelOrderUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky hover:underline"
                          >
                            Открыть заказ
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className={`${cabinetCardClass} overflow-hidden`}>
              <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
                Последние клики
              </h2>
              <ul className="divide-y divide-gray-100">
                {stats.recentClicks.length === 0 ? (
                  <li className="px-5 py-8 text-sm text-slate">Пока нет кликов</li>
                ) : (
                  stats.recentClicks.map((row) => (
                    <li key={row.id} className="space-y-1 px-5 py-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/excursions/${row.experienceSlug}`} className="text-sky hover:underline">
                          {row.experienceSlug}
                        </Link>
                        <span className="text-slate">{formatAdminWhen(row.createdAt)}</span>
                      </div>
                      {row.referer ? <p className="truncate text-slate">{row.referer}</p> : null}
                    </li>
                  ))
                )}
              </ul>
            </section>
          </>
        )}
      </AdminPageShell>
    </CapabilityGate>
  );
}
