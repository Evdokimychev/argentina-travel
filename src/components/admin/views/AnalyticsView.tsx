"use client";

import Link from "next/link";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { BOOKING_STATUS_LABELS } from "@/data/booking-statuses";
import type { AdminAnalyticsPayload } from "@/lib/admin/analytics-server";
import { cabinetStatCardClass } from "@/lib/cabinet-ui";

type AnalyticsResponse = { analytics?: AdminAnalyticsPayload };

export default function AnalyticsView() {
  const { data, loading, error } = useAdminApi<AnalyticsResponse>("/api/admin/analytics");
  const analytics = data?.analytics;

  return (
    <CapabilityGate capability="analytics.view">
      <AdminPageShell>
        <AdminPageHeader
          title="Аналитика"
          subtitle="Сводные показатели платформы"
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
            {analytics?.operations.bookingsByStatus ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {Object.entries(analytics.operations.bookingsByStatus).map(([status, count]) => (
                  <li
                    key={status}
                    className="rounded-full bg-sky/10 px-3 py-1 text-xs font-medium text-sky"
                  >
                    {BOOKING_STATUS_LABELS[status as keyof typeof BOOKING_STATUS_LABELS] ?? status}: {count}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            <h2 className="font-heading text-lg font-bold text-charcoal">Маркетплейс</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Туры", value: analytics?.marketplace.tourCount, href: "/admin/marketplace/tours" },
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
