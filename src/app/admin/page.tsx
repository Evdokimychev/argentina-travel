"use client";

import { useState } from "react";
import Link from "next/link";
import AdminTrendChart from "@/components/admin/AdminTrendChart";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { NativeSelect } from "@/components/ui/native-select";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass, cabinetStatCardClass } from "@/lib/cabinet-ui";
import type { AdminDashboardWidgets } from "@/types/admin";
import type { AnalyticsPeriod } from "@/types/admin-analytics";
import { ANALYTICS_PERIOD_LABELS } from "@/types/admin-analytics";

type DashboardResponse = { widgets?: AdminDashboardWidgets };

const QUICK_LINKS = [
  { href: "/admin/operations/leads", label: "Лиды и заявки" },
  { href: "/admin/operations/bookings", label: "Бронирования" },
  { href: "/admin/operations/shop-orders", label: "Заказы магазина" },
  { href: "/admin/marketplace/tours", label: "Туры" },
  { href: "/admin/marketplace/moderation", label: "Модерация" },
  { href: "/admin/marketplace/excursions", label: "Экскурсии" },
  { href: "/admin/content/documents", label: "Контент" },
  { href: "/admin/analytics", label: "Аналитика" },
];

function formatUsd(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const { data, loading, error } = useAdminApi<DashboardResponse>(`/api/admin/dashboard?period=${period}`);
  const widgets = data?.widgets;
  const periodHint = widgets
    ? widgets.periodStart
      ? `Период: с ${formatAdminWhen(widgets.periodStart)}`
      : "Период: всё время"
    : null;

  return (
    <CapabilityGate capability="dashboard.view">
      <AdminPageShell>
        <AdminPageHeader
          title="Панель управления"
          subtitle="Ключевые показатели по операциям"
          actions={
            <NativeSelect
              value={period}
              onChange={(event) => setPeriod(event.target.value as AnalyticsPeriod)}
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
        {!error && periodHint && widgets ? (
          <p className="text-sm text-slate">
            {periodHint} · Обновлено {formatAdminWhen(widgets.generatedAt)}
          </p>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Новые лиды", value: widgets?.totals.newLeads, href: "/admin/operations/leads" },
            {
              label: "Новые бронирования",
              value: widgets?.totals.newBookings,
              href: "/admin/operations/bookings",
            },
            { label: "Заказы магазина", value: widgets?.totals.shopOrders, href: "/admin/operations/shop-orders" },
            {
              label: "Очередь модерации",
              value: widgets?.totals.pendingModeration,
              href: "/admin/marketplace/moderation",
            },
            {
              label: "Оценка выручки",
              value: widgets ? formatUsd(widgets.totals.bookingRevenueUsd) : "0",
              href: "/admin/operations/bookings",
            },
          ].map((item) => (
            <div key={item.label} className={cabinetStatCardClass}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate">{item.label}</p>
              <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
                {loading ? "…" : (item.value ?? 0)}
              </p>
              {item.href ? (
                <Link href={item.href} className="mt-3 inline-block text-sm text-sky hover:underline">
                  Открыть раздел
                </Link>
              ) : null}
            </div>
          ))}
        </section>

        {period !== "all" ? (
          <section className="grid gap-4 lg:grid-cols-2">
            <AdminTrendChart title="Бронирования по дням" points={widgets?.trends.bookingsByDay ?? []} />
            <AdminTrendChart title="Лиды по дням" points={widgets?.trends.leadsByDay ?? []} />
          </section>
        ) : (
          <section className={`${cabinetCardClass} p-4 text-sm text-slate`}>
            Для режима «Всё время» графики по дням не строятся.
          </section>
        )}

        <section className={`${cabinetCardClass} p-5`}>
          <h2 className="font-heading text-lg font-bold text-charcoal">Быстрые ссылки</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
