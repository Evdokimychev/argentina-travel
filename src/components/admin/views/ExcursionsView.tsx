"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";

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

export default function ExcursionsView() {
  const { data, loading, error, refresh } = useAdminApi<ExcursionsResponse>("/api/admin/excursions");
  const stats = data?.stats ?? null;

  return (
    <CapabilityGate capability="marketplace.excursions">
      <AdminPageShell>
        <AdminPageHeader
          title="Экскурсии"
          subtitle="Tripster и партнёрская аналитика"
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

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
