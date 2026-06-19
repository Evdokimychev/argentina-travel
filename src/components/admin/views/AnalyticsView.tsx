"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import AdminTrendChart from "@/components/admin/AdminTrendChart";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { NativeSelect } from "@/components/ui/native-select";
import { useAdminApi } from "@/hooks/useAdminApi";
import { BOOKING_STATUS_LABELS } from "@/data/booking-statuses";
import type { AdminAnalyticsV2Payload, AnalyticsPeriod } from "@/types/admin-analytics";
import {
  ANALYTICS_PERIOD_LABELS,
  CONTACT_KIND_LABELS,
} from "@/types/admin-analytics";
import { cabinetCardClass, cabinetStatCardClass } from "@/lib/cabinet-ui";

type AnalyticsResponse = { analytics?: AdminAnalyticsV2Payload };

function formatUsd(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AnalyticsView() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const { data, loading, error } = useAdminApi<AnalyticsResponse>(
    `/api/admin/analytics?period=${period}`
  );
  const analytics = data?.analytics;

  return (
    <CapabilityGate capability="analytics.view">
      <AdminPageShell>
        <AdminPageHeader
          title="Аналитика"
          subtitle="Динамика, выручка и воронка за выбранный период"
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

        <section className="space-y-8">
          <div>
            <h2 className="font-heading text-lg font-bold text-charcoal">Операции</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Подписки", value: analytics?.operations.newsletterCount },
                { label: "Заявки с сайта", value: analytics?.operations.contactCount },
                { label: "Заказы магазина", value: analytics?.operations.shopOrderCount },
                { label: "Бронирования", value: analytics?.operations.bookingCount },
              ].map((item) => (
                <div key={item.label} className={cabinetStatCardClass}>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate">{item.label}</p>
                  <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
                    {loading ? "…" : (item.value ?? 0)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Сумма бронирований (без отмен)",
                  value: analytics ? formatUsd(analytics.operations.bookingPipelineUsd) : "…",
                },
                {
                  label: "Оплачено в магазине",
                  value: analytics ? formatUsd(analytics.operations.shopPaidUsd) : "…",
                },
                {
                  label: "Заказано в магазине",
                  value: analytics ? formatUsd(analytics.operations.shopOrderUsd) : "…",
                },
              ].map((item) => (
                <div key={item.label} className={`${cabinetCardClass} p-4`}>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate">{item.label}</p>
                  <p className="mt-2 font-heading text-xl font-bold text-charcoal">
                    {loading ? "…" : item.value}
                  </p>
                </div>
              ))}
            </div>

            {analytics?.operations.bookingsByStatus ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {Object.entries(analytics.operations.bookingsByStatus).map(([status, count]) => (
                  <li
                    key={status}
                    className="rounded-full bg-sky/10 px-3 py-1 text-xs font-medium text-sky"
                  >
                    {BOOKING_STATUS_LABELS[status as keyof typeof BOOKING_STATUS_LABELS] ?? status}:{" "}
                    {count}
                  </li>
                ))}
              </ul>
            ) : null}

            {analytics?.operations.contactsByKind &&
            Object.keys(analytics.operations.contactsByKind).length > 0 ? (
              <div className={`${cabinetCardClass} mt-4 p-4`}>
                <h3 className="text-sm font-medium text-charcoal">Заявки по типу</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(analytics.operations.contactsByKind).map(([kind, count]) => (
                    <li
                      key={kind}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-charcoal"
                    >
                      {CONTACT_KIND_LABELS[kind] ?? kind}: {count}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {period !== "all" && analytics?.trends ? (
            <div>
              <h2 className="font-heading text-lg font-bold text-charcoal">Динамика</h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <AdminTrendChart title="Бронирования" points={analytics.trends.bookingsByDay} />
                <AdminTrendChart title="Заявки с сайта" points={analytics.trends.contactsByDay} />
                <AdminTrendChart title="Заказы магазина" points={analytics.trends.shopOrdersByDay} />
                <AdminTrendChart title="Подписки" points={analytics.trends.newsletterByDay} />
              </div>
            </div>
          ) : null}

          <div>
            <h2 className="font-heading text-lg font-bold text-charcoal">Маркетплейс</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Туры (всего)", value: analytics?.marketplace.tourCount, href: "/admin/marketplace/tours" },
                {
                  label: "Новые туры за период",
                  value: analytics?.marketplace.newToursInPeriod,
                },
                {
                  label: "На модерации",
                  value: analytics?.marketplace.pendingModerationCount,
                  href: "/admin/marketplace/moderation",
                },
                {
                  label: "Экскурсии",
                  value: analytics?.marketplace.excursionExperienceCount,
                  href: "/admin/marketplace/excursions",
                },
              ].map((item) => (
                <div key={item.label} className={cabinetStatCardClass}>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate">{item.label}</p>
                  <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
                    {loading ? "…" : (item.value ?? 0)}
                  </p>
                  {item.href ? (
                    <Link href={item.href} className="mt-3 inline-block text-sm text-sky hover:underline">
                      Открыть
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-heading text-lg font-bold text-charcoal">Контент</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: "Статьи", value: analytics?.content.blogPublished },
                { label: "В плане", value: analytics?.content.blogPlanned },
                { label: "Путеводитель", value: analytics?.content.guideTopics },
                { label: "Направления", value: analytics?.content.destinations },
                { label: "Места", value: analytics?.content.places },
              ].map((item) => (
                <div key={item.label} className={cabinetStatCardClass}>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate">{item.label}</p>
                  <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
                    {loading ? "…" : (item.value ?? 0)}
                  </p>
                </div>
              ))}
            </div>
            <Link href="/admin/content/documents" className="mt-4 inline-block text-sm text-sky hover:underline">
              Каталог документов →
            </Link>
          </div>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
