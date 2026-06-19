"use client";

import Link from "next/link";
import { useState } from "react";
import FormattedPrice from "@/components/FormattedPrice";
import BookingPaymentStatusBadge from "@/components/booking/BookingPaymentStatusBadge";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import { AdminPaymentLedgerPanel } from "@/components/admin/views/AdminPaymentLedgerView";
import { AdminPayoutsPanel } from "@/components/admin/views/AdminPayoutsView";
import { AdminReconciliationPanel } from "@/components/admin/views/AdminReconciliationView";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { NativeSelect } from "@/components/ui/native-select";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass, cabinetTableHeaderClass, cabinetTableWrapClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";
import {
  ADMIN_PAYMENT_STATUS_FILTER_LABELS,
  type AdminPaymentPeriodFilter,
  type AdminPaymentStatusFilter,
  type AdminPaymentsSummaryStats,
  type BookingPaymentOverview,
} from "@/types/admin-payments";
import { ANALYTICS_PERIOD_LABELS } from "@/types/admin-analytics";
import { BOOKING_CHECKOUT_PAYMENT_LABELS } from "@/types/booking-params";

type AdminPaymentsResponse = {
  payments?: BookingPaymentOverview[];
  stats?: AdminPaymentsSummaryStats;
};

const PAYMENT_LINK_STATUS_LABELS: Record<BookingPaymentOverview["paymentLinkStatus"], string> = {
  active: "Ссылка активна",
  paid: "Ссылка оплачена",
  expired: "Ссылка истекла",
  cancelled: "Ссылка отменена",
  none: "Ссылки нет",
};

type AdminPaymentsTab = "bookings" | "ledger" | "reconciliation" | "payouts";

const TAB_LABELS: Record<AdminPaymentsTab, string> = {
  bookings: "Бронирования",
  ledger: "Журнал операций",
  reconciliation: "Сверка",
  payouts: "Выплаты и комиссии",
};

export default function AdminPaymentsView({ initialTab = "bookings" }: { initialTab?: AdminPaymentsTab }) {
  const [tab, setTab] = useState<AdminPaymentsTab>(initialTab);
  const [period, setPeriod] = useState<AdminPaymentPeriodFilter>("30d");
  const [status, setStatus] = useState<AdminPaymentStatusFilter>("all");
  const { data, loading, error, refresh } = useAdminApi<AdminPaymentsResponse>(
    `/api/admin/payments?period=${period}&status=${status}`
  );

  const payments = data?.payments ?? [];
  const stats = data?.stats;

  const subtitle =
    tab === "bookings"
      ? "Сводка по оплатам без проведения списаний и интеграции с платёжным шлюзом"
      : tab === "ledger"
        ? "Read-only реестр списаний, возвратов и выплат"
        : tab === "payouts"
          ? "Пакеты выплат организаторам и отчёт по комиссиям платформы"
          : "Сводка по списаниям, возвратам и выплатам организаторам";

  return (
    <CapabilityGate capability="operations.bookings">
      <AdminPageShell>
        <AdminPageHeader
          title="Платежи"
          subtitle={subtitle}
          actions={
            tab === "bookings" ? (
              <div className="flex flex-wrap gap-2">
                <NativeSelect
                  value={period}
                  onChange={(event) => setPeriod(event.target.value as AdminPaymentPeriodFilter)}
                  className="w-40"
                >
                  {(Object.keys(ANALYTICS_PERIOD_LABELS) as AdminPaymentPeriodFilter[]).map((value) => (
                    <option key={value} value={value}>
                      {ANALYTICS_PERIOD_LABELS[value]}
                    </option>
                  ))}
                </NativeSelect>
                <NativeSelect
                  value={status}
                  onChange={(event) => setStatus(event.target.value as AdminPaymentStatusFilter)}
                  className="w-52"
                >
                  {(Object.keys(ADMIN_PAYMENT_STATUS_FILTER_LABELS) as AdminPaymentStatusFilter[]).map(
                    (value) => (
                      <option key={value} value={value}>
                        {ADMIN_PAYMENT_STATUS_FILTER_LABELS[value]}
                      </option>
                    )
                  )}
                </NativeSelect>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  disabled={loading}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-gray-50 disabled:opacity-60"
                >
                  Обновить
                </button>
              </div>
            ) : null
          }
        />

        <div className="flex flex-wrap gap-2">
          {(Object.keys(TAB_LABELS) as AdminPaymentsTab[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                tab === value
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-charcoal hover:bg-gray-200/80"
              )}
            >
              {TAB_LABELS[value]}
            </button>
          ))}
        </div>

        {tab === "ledger" ? <AdminPaymentLedgerPanel /> : null}
        {tab === "reconciliation" ? <AdminReconciliationPanel /> : null}
        {tab === "payouts" ? <AdminPayoutsPanel /> : null}

        {tab === "bookings" ? (
          <>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {stats ? (
          <section className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-warning-muted px-3 py-1 text-xs font-medium text-warning">
              Ожидают: {stats.byStatus.pending}
            </span>
            <span className="rounded-full bg-sky/10 px-3 py-1 text-xs font-medium text-sky">
              Частично: {stats.byStatus.partial}
            </span>
            <span className="rounded-full bg-success-muted px-3 py-1 text-xs font-medium text-success">
              Оплачено: {stats.byStatus.paid}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-charcoal">
              Возвраты: {stats.byStatus.refunded}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-charcoal">
              К оплате: <FormattedPrice priceUsd={stats.totalDue} />
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-charcoal">
              Оплачено: <FormattedPrice priceUsd={stats.totalPaid} />
            </span>
          </section>
        ) : null}

        <section className={`${cabinetCardClass} space-y-4 p-4 sm:p-6`}>
          <div className={cabinetTableWrapClass}>
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className={cabinetTableHeaderClass}>
                <tr>
                  <th className="px-4 py-3 font-medium text-slate">Бронирование</th>
                  <th className="px-4 py-3 font-medium text-slate">Контакт туриста</th>
                  <th className="px-4 py-3 font-medium text-slate">Статус оплаты</th>
                  <th className="px-4 py-3 font-medium text-slate">К оплате</th>
                  <th className="px-4 py-3 font-medium text-slate">Оплачено</th>
                  <th className="px-4 py-3 font-medium text-slate">Детали</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate">
                      {loading ? "Загрузка…" : "Платежные данные не найдены"}
                    </td>
                  </tr>
                ) : (
                  payments.map((row) => (
                    <tr key={row.bookingId}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-charcoal">{row.tourTitle}</p>
                        <p className="mt-1 text-xs text-slate">{row.bookingId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-charcoal">{row.contactEmail}</p>
                        {row.organizerUserId ? (
                          <p className="mt-1 text-xs text-slate">Организатор: {row.organizerUserId}</p>
                        ) : (
                          <p className="mt-1 text-xs text-slate">Организатор не указан</p>
                        )}
                      </td>
                      <td className="space-y-1 px-4 py-3">
                        <BookingPaymentStatusBadge status={row.paymentStatus} />
                        <p className="text-xs text-slate">{PAYMENT_LINK_STATUS_LABELS[row.paymentLinkStatus]}</p>
                        <p className="text-xs text-slate">
                          Способ оплаты:{" "}
                          {row.checkoutPaymentOption
                            ? BOOKING_CHECKOUT_PAYMENT_LABELS[row.checkoutPaymentOption]
                            : "Не выбран"}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-medium text-charcoal">
                        <FormattedPrice priceUsd={row.amountDue} />{" "}
                        <span className="text-xs text-slate">{row.currency}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-charcoal">
                        <FormattedPrice priceUsd={row.amountPaid} />{" "}
                        <span className="text-xs text-slate">{row.currency}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/operations/bookings?bookingId=${encodeURIComponent(row.bookingId)}`}
                          className="text-sm font-medium text-sky hover:underline"
                        >
                          Открыть заявку
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
          </>
        ) : null}
      </AdminPageShell>
    </CapabilityGate>
  );
}
