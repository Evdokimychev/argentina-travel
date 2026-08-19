"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRing, Boxes, CreditCard, FileCheck2, HeartPulse, UserCheck } from "lucide-react";
import AdminTrendChart from "@/components/admin/AdminTrendChart";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { NativeSelect } from "@/components/ui/native-select";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass, cabinetStatCardClass } from "@/lib/cabinet-ui";
import type { AdminDashboardWidgets, AdminOperationsSummary } from "@/types/admin";
import type { AnalyticsPeriod } from "@/types/admin-analytics";
import { ANALYTICS_PERIOD_LABELS } from "@/types/admin-analytics";
import { ActionQueue, type ActionQueueItem } from "@/components/workspace/ActionQueue";
import AdminOwnerOnboardingChecklist from "@/components/admin/AdminOwnerOnboardingChecklist";

type DashboardResponse = {
  widgets?: AdminDashboardWidgets;
  moduleHealth?: {
    total: number;
    active: number;
    disabled: number;
    attention: Array<{ id: string; label: string; status: string; reason: string | null }>;
    checkedAt: string;
  };
};
type OperationsSummaryResponse = { summary?: AdminOperationsSummary };

const QUICK_LINKS = [
  { href: "/admin/operations", label: "Центр операций" },
  { href: "/admin/operations/leads", label: "Лиды и заявки" },
  { href: "/admin/operations/bookings", label: "Бронирования" },
  { href: "/admin/operations/shop-orders", label: "Заказы магазина" },
  { href: "/admin/marketplace/tours", label: "Туры" },
  { href: "/admin/marketplace/organizers", label: "Организаторы" },
  { href: "/admin/marketplace/moderation", label: "Модерация" },
  { href: "/admin/marketplace/excursions", label: "Экскурсии" },
  { href: "/admin/content/documents", label: "Контент" },
  { href: "/admin/content/translations", label: "Переводы контента" },
  { href: "/admin/analytics", label: "Аналитика" },
  { href: "/admin/analytics/funnels", label: "Воронки" },
  { href: "/admin/modules", label: "Модули сайта" },
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
  const { data: operationsData, loading: operationsLoading } = useAdminApi<OperationsSummaryResponse>(
    "/api/admin/operations/summary"
  );
  const widgets = data?.widgets;
  const healthStatus = operationsData?.summary?.health.status;
  const healthChipClass =
    healthStatus === "ok"
      ? "bg-success-muted text-success"
      : healthStatus === "degraded"
        ? "bg-warning-muted text-warning"
        : "bg-gray-100 text-slate";
  const periodHint = widgets
    ? widgets.periodStart
      ? `Период: с ${formatAdminWhen(widgets.periodStart)}`
      : "Период: всё время"
    : null;
  const operations = operationsData?.summary;
  const moduleAttention = data?.moduleHealth?.attention ?? [];
  const actionItems: ActionQueueItem[] = [
    ...(moduleAttention.length
      ? [{
          id: "modules",
          title: `${moduleAttention.length} модулей требуют внимания`,
          description: moduleAttention.slice(0, 2).map((item) => item.label).join(", "),
          href: "/admin/modules",
          label: "Проверить модули",
          priority: "high" as const,
          count: moduleAttention.length,
          icon: Boxes,
        }]
      : []),
    ...(operations?.moderation.pendingCount
      ? [{
          id: "moderation",
          title: `${operations.moderation.pendingCount} материалов ожидают модерации`,
          description: operations.moderation.oldestPendingAgeMinutes
            ? `Самый ранний материал ждёт ${Math.max(1, Math.round(operations.moderation.oldestPendingAgeMinutes / 60))} ч.`
            : "Проверьте материалы перед публикацией.",
          href: "/admin/marketplace/moderation",
          label: "Проверить",
          priority: "high" as const,
          count: operations.moderation.pendingCount,
          icon: FileCheck2,
        }]
      : []),
    ...(operations?.organizerApplications.pendingCount
      ? [{
          id: "organizers",
          title: `${operations.organizerApplications.pendingCount} заявок организаторов ждут решения`,
          description: "Проверьте профиль и доступ к публикации предложений.",
          href: "/admin/marketplace/organizers",
          label: "Рассмотреть",
          priority: "high" as const,
          count: operations.organizerApplications.pendingCount,
          icon: UserCheck,
        }]
      : []),
    ...(operations?.payments.pendingOrPartialCount
      ? [{
          id: "payments",
          title: `${operations.payments.pendingOrPartialCount} оплат требуют проверки`,
          description: "Есть незавершённые или частично проведённые оплаты.",
          href: "/admin/operations/payments",
          label: "Сверить",
          priority: "medium" as const,
          count: operations.payments.pendingOrPartialCount,
          icon: CreditCard,
        }]
      : []),
    ...(operations?.leads.newLast24h
      ? [{
          id: "leads",
          title: `${operations.leads.newLast24h} новых обращений за сутки`,
          description: "Проверьте источник и статус в CRM, чтобы заявка не потерялась.",
          href: "/admin/operations/leads",
          label: "Открыть CRM",
          priority: "high" as const,
          count: operations.leads.newLast24h,
          icon: BellRing,
        }]
      : []),
    ...(operations?.cms.draftCount || operations?.cms.scheduledCount
      ? [{
          id: "cms",
          title: `${operations.cms.draftCount} черновиков и ${operations.cms.scheduledCount} отложенных публикаций`,
          description: "Материалы ждут проверки или времени публикации.",
          href: "/admin/content/documents",
          label: "Открыть CMS",
          priority: "medium" as const,
          count: operations.cms.draftCount + operations.cms.scheduledCount,
          icon: FileCheck2,
        }]
      : []),
    ...(operations?.partners.staleOrDownCount
      ? [{
          id: "partners",
          title: `${operations.partners.staleOrDownCount} партнёрских лент требуют внимания`,
          description: "Синхронизация устарела или недоступна — проверьте карантин и свежесть.",
          href: "/admin/system/settings",
          label: "Проверить ленты",
          priority: "medium" as const,
          count: operations.partners.staleOrDownCount,
          icon: HeartPulse,
        }]
      : []),
    ...(operations?.notifications.unreadCount
      ? [{
          id: "notifications",
          title: `${operations.notifications.unreadCount} непрочитанных уведомлений`,
          description: "Проверьте новые события по операциям сайта.",
          href: "/admin/operations",
          label: "Открыть",
          priority: "low" as const,
          count: operations.notifications.unreadCount,
          icon: BellRing,
        }]
      : []),
  ];

  return (
    <CapabilityGate capability="dashboard.view">
      <AdminPageShell>
        <AdminPageHeader
          title="Панель управления"
          subtitle="Задачи владельца, продажи, контент и состояние платформы"
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
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-slate">
              {periodHint} · Обновлено {formatAdminWhen(widgets.generatedAt)}
            </p>
            <Link
              href="/admin/operations"
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${healthChipClass}`}
            >
              Сайт: {operationsLoading ? "проверяем…" : healthStatus === "ok" ? "работает штатно" : healthStatus === "degraded" ? "нужна проверка" : "нет данных"}
            </Link>
          </div>
        ) : null}

        <AdminOwnerOnboardingChecklist />

        <ActionQueue
          title="Сегодня"
          description="Очередь действий собрана из реальных заявок, оплат и модерации."
          items={actionItems}
          emptyTitle="Обязательных задач нет"
          emptyDescription="Очереди модерации, заявок организаторов и проблемных оплат сейчас пусты."
        />

        <section aria-labelledby="sales-heading">
          <h2 id="sales-heading" className="mb-4 font-heading text-lg font-bold text-foreground">Продажи</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Новые лиды", value: widgets?.totals.newLeads, href: "/admin/operations/leads" },
            {
              label: "Новые бронирования",
              value: widgets?.totals.newBookings,
              href: "/admin/operations/bookings",
            },
            { label: "Заказы магазина", value: widgets?.totals.shopOrders, href: "/admin/operations/shop-orders" },
            {
              label: "Сумма активных бронирований",
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
          </div>
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

        <section className={`${cabinetCardClass} p-5`} aria-labelledby="content-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="content-heading" className="font-heading text-lg font-bold text-charcoal">Контент</h2>
              <p className="mt-1 text-sm text-slate">Публикации, медиа, переводы и актуальность материалов.</p>
            </div>
            <Link href="/admin/content/documents" className="text-sm font-semibold text-sky hover:underline">Открыть редакцию</Link>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {QUICK_LINKS.filter((link) => link.href.startsWith("/admin/content") || link.href.includes("moderation")).map((link) => (
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

        <section className={`${cabinetCardClass} p-5`} aria-labelledby="platform-heading">
          <div className="flex items-start gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${healthChipClass}`}>
              <HeartPulse className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="platform-heading" className="font-heading text-lg font-bold text-charcoal">Платформа</h2>
              <p className="mt-1 text-sm text-slate">
                {operationsLoading
                  ? "Проверяем базу данных, синхронизацию и правила доступа…"
                  : healthStatus === "ok"
                    ? "База данных, синхронизация и правила доступа работают штатно."
                    : "Одна или несколько системных проверок требуют внимания."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link href="/admin/operations" className="font-semibold text-sky hover:underline">Центр операций</Link>
                <Link href="/admin/system/audit" className="font-semibold text-sky hover:underline">Журнал действий</Link>
                <Link href="/admin/feature-flags" className="font-semibold text-sky hover:underline">Управление функциями</Link>
                <Link href="/admin/modules" className="font-semibold text-sky hover:underline">Состояние модулей</Link>
              </div>
            </div>
          </div>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
