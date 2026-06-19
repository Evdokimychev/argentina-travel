"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass, cabinetStatCardClass } from "@/lib/cabinet-ui";
import type { AdminOperationsSummary } from "@/types/admin";

type OperationsSummaryResponse = {
  summary?: AdminOperationsSummary;
};

function formatPendingAge(ageMinutes: number | null): string {
  if (ageMinutes === null) return "очередь пуста";
  if (ageMinutes < 60) return `${ageMinutes} мин`;
  const hours = Math.floor(ageMinutes / 60);
  if (hours < 24) return `${hours} ч`;
  const days = Math.floor(hours / 24);
  return `${days} д`;
}

export default function OperationsCommandView() {
  const { data, loading, error, refresh } = useAdminApi<OperationsSummaryResponse>(
    "/api/admin/operations/summary"
  );
  const summary = data?.summary;
  const healthStatus = summary?.health.status;
  const healthClass =
    healthStatus === "ok"
      ? "bg-success-muted text-success"
      : healthStatus === "degraded"
        ? "bg-warning-muted text-warning"
        : "bg-gray-100 text-slate";

  return (
    <CapabilityGate capability="dashboard.view">
      <AdminPageShell>
        <AdminPageHeader
          title="Центр операций"
          subtitle="Единая сводка по ключевым очередям и ежедневным действиям"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/api/admin/health"
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${healthClass}`}
              >
                Здоровье: {healthStatus ?? "—"}
              </Link>
              <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
                Обновить
              </Button>
            </div>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {summary ? (
          <p className="text-sm text-slate">
            Обновлено {formatAdminWhen(summary.generatedAt)} · Проверка health:{" "}
            {formatAdminWhen(summary.health.generatedAt)}
          </p>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className={cabinetStatCardClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Модерация</p>
            <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
              {loading ? "…" : (summary?.moderation.pendingCount ?? 0)}
            </p>
            <p className="mt-1 text-sm text-slate">
              Старейший элемент: {formatPendingAge(summary?.moderation.oldestPendingAgeMinutes ?? null)}
            </p>
            <Link href="/admin/marketplace/moderation" className="mt-3 inline-block text-sm text-sky hover:underline">
              Открыть модерацию
            </Link>
          </article>

          <article className={cabinetStatCardClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Лиды за 24 часа</p>
            <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
              {loading ? "…" : (summary?.leads.newLast24h ?? 0)}
            </p>
            <p className="mt-1 text-sm text-slate">
              Непрочитанные уведомления: {loading ? "…" : (summary?.notifications.unreadCount ?? 0)}
            </p>
            <Link href="/admin/operations/leads" className="mt-3 inline-block text-sm text-sky hover:underline">
              Открыть лиды
            </Link>
          </article>

          <article className={cabinetStatCardClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Платежи к обработке</p>
            <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
              {loading ? "…" : (summary?.payments.pendingOrPartialCount ?? 0)}
            </p>
            <p className="mt-1 text-sm text-slate">Статусы pending и partial</p>
            <Link href="/admin/operations/payments" className="mt-3 inline-block text-sm text-sky hover:underline">
              Открыть платежи
            </Link>
          </article>

          <article className={cabinetStatCardClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Заявки организаторов</p>
            <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
              {loading ? "…" : (summary?.organizerApplications.pendingCount ?? 0)}
            </p>
            <p className="mt-1 text-sm text-slate">Ожидают решения модератора</p>
            <Link href="/admin/marketplace/organizers" className="mt-3 inline-block text-sm text-sky hover:underline">
              Открыть раздел
            </Link>
          </article>

          <article className={cabinetStatCardClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Бронирования</p>
            <p className="mt-2 text-sm text-slate">Контроль статусов заявок и ручная обработка обращений.</p>
            <Link href="/admin/operations/bookings" className="mt-3 inline-block text-sm text-sky hover:underline">
              Открыть бронирования
            </Link>
          </article>

          <article className={cabinetStatCardClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Магазин</p>
            <p className="mt-2 text-sm text-slate">Проверка цифровых заказов, оплат и ссылок на доставку.</p>
            <Link href="/admin/operations/shop-orders" className="mt-3 inline-block text-sm text-sky hover:underline">
              Открыть магазин
            </Link>
          </article>
        </section>

        <section className={`${cabinetCardClass} p-5`}>
          <h2 className="font-heading text-lg font-bold text-charcoal">Быстрые действия</h2>
          <p className="mt-2 text-sm text-slate">
            Начинайте смену с очередей, где есть просрочка или деградация health, затем переходите к платежам и лидам.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/marketplace/moderation"
              className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
            >
              Модерация
            </Link>
            <Link
              href="/admin/marketplace/organizers"
              className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
            >
              Организаторы
            </Link>
            <Link
              href="/admin/operations/bookings"
              className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
            >
              Бронирования
            </Link>
            <Link
              href="/admin/operations/payments"
              className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
            >
              Платежи
            </Link>
            <Link
              href="/admin/operations/leads"
              className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
            >
              Лиды
            </Link>
            <Link
              href="/admin/operations/shop-orders"
              className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
            >
              Магазин
            </Link>
          </div>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
