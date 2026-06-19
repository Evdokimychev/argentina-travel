"use client";

import Link from "next/link";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass, cabinetStatCardClass } from "@/lib/cabinet-ui";
import type { AdminDashboardSummary } from "@/types/admin";

type SummaryResponse = { summary?: AdminDashboardSummary };

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

export default function AdminDashboardPage() {
  const { data, loading, error } = useAdminApi<SummaryResponse>("/api/admin/summary");
  const summary = data?.summary;

  return (
    <CapabilityGate capability="dashboard.view">
      <AdminPageShell>
        <AdminPageHeader
          title="Панель управления"
          subtitle="Сводка по операциям и маркетплейсу"
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Подписки", value: summary?.newsletterCount, href: "/admin/operations/leads" },
            { label: "Заявки с сайта", value: summary?.contactCount, href: "/admin/operations/leads" },
            { label: "Заказы магазина", value: summary?.shopOrderCount, href: "/admin/operations/shop-orders" },
            { label: "Бронирования", value: summary?.bookingCount, href: "/admin/operations/bookings" },
            { label: "Туры в базе", value: summary?.tourCount, href: "/admin/marketplace/tours" },
            { label: "Экскурсии", value: summary?.excursionExperienceCount, href: "/admin/marketplace/excursions" },
            {
              label: "Очередь модерации",
              value: summary?.pendingModerationCount,
              href: "/admin/marketplace/moderation",
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
