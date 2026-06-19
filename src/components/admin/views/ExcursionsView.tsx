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
