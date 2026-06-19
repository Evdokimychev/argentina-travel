"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import FormattedPrice from "@/components/FormattedPrice";
import { NativeSelect } from "@/components/ui/native-select";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass, cabinetTableHeaderClass, cabinetTableWrapClass } from "@/lib/cabinet-ui";
import {
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_TRANSACTION_STATUS_LABELS,
  PAYMENT_TRANSACTION_TYPE_LABELS,
  type PaymentTransactionRow,
  type PaymentTransactionStatus,
  type PaymentTransactionType,
} from "@/types/payment-platform";
import type { PaymentProviderId } from "@/types/payment-webhook";
import type { AdminPaymentPeriodFilter } from "@/types/admin-payments";
import { ANALYTICS_PERIOD_LABELS } from "@/types/admin-analytics";

type LedgerResponse = {
  transactions?: PaymentTransactionRow[];
};

const TYPE_FILTER_LABELS: Record<PaymentTransactionType | "all", string> = {
  all: "Все типы",
  ...PAYMENT_TRANSACTION_TYPE_LABELS,
};

const STATUS_FILTER_LABELS: Record<PaymentTransactionStatus | "all", string> = {
  all: "Все статусы",
  ...PAYMENT_TRANSACTION_STATUS_LABELS,
};

const PROVIDER_FILTER_LABELS: Record<PaymentProviderId | "all", string> = {
  all: "Все провайдеры",
  ...PAYMENT_PROVIDER_LABELS,
};

export function AdminPaymentLedgerPanel() {
  const [period, setPeriod] = useState<AdminPaymentPeriodFilter>("30d");
  const [type, setType] = useState<PaymentTransactionType | "all">("all");
  const [status, setStatus] = useState<PaymentTransactionStatus | "all">("all");
  const [provider, setProvider] = useState<PaymentProviderId | "all">("all");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const query = `/api/admin/payments/transactions?period=${period}&type=${type}&status=${status}&provider=${provider}`;
  const { data, loading, error, refresh } = useAdminApi<LedgerResponse>(query);

  const transactions = data?.transactions ?? [];

  const handleRefundAction = useCallback(
    async (transactionId: string, action: "approve" | "reject") => {
      setActionError(null);
      setActionLoadingId(transactionId);
      try {
        const response = await fetch(`/api/admin/payments/refunds/${transactionId}/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) {
          setActionError(payload.error ?? "Не удалось выполнить действие");
          return;
        }
        await refresh();
      } catch {
        setActionError("Не удалось выполнить действие");
      } finally {
        setActionLoadingId(null);
      }
    },
    [refresh]
  );

  return (
    <>
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
          value={type}
          onChange={(event) => setType(event.target.value as PaymentTransactionType | "all")}
          className="w-40"
        >
          {(Object.keys(TYPE_FILTER_LABELS) as Array<PaymentTransactionType | "all">).map((value) => (
            <option key={value} value={value}>
              {TYPE_FILTER_LABELS[value]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={status}
          onChange={(event) => setStatus(event.target.value as PaymentTransactionStatus | "all")}
          className="w-44"
        >
          {(Object.keys(STATUS_FILTER_LABELS) as Array<PaymentTransactionStatus | "all">).map(
            (value) => (
              <option key={value} value={value}>
                {STATUS_FILTER_LABELS[value]}
              </option>
            )
          )}
        </NativeSelect>
        <NativeSelect
          value={provider}
          onChange={(event) => setProvider(event.target.value as PaymentProviderId | "all")}
          className="w-44"
        >
          {(Object.keys(PROVIDER_FILTER_LABELS) as Array<PaymentProviderId | "all">).map((value) => (
            <option key={value} value={value}>
              {PROVIDER_FILTER_LABELS[value]}
            </option>
          ))}
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

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}

      <section className={`${cabinetCardClass} space-y-4 p-4 sm:p-6`}>
          <div className={cabinetTableWrapClass}>
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className={cabinetTableHeaderClass}>
                <tr>
                  <th className="px-4 py-3 font-medium text-slate">Дата</th>
                  <th className="px-4 py-3 font-medium text-slate">Тип</th>
                  <th className="px-4 py-3 font-medium text-slate">Бронирование</th>
                  <th className="px-4 py-3 font-medium text-slate">Провайдер</th>
                  <th className="px-4 py-3 font-medium text-slate">Сумма</th>
                  <th className="px-4 py-3 font-medium text-slate">Статус</th>
                  <th className="px-4 py-3 font-medium text-slate">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate">
                      {loading ? "Загрузка…" : "Операции не найдены"}
                    </td>
                  </tr>
                ) : (
                  transactions.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 text-slate">
                        {new Date(row.createdAt).toLocaleString("ru-RU")}
                      </td>
                      <td className="px-4 py-3 text-charcoal">
                        {PAYMENT_TRANSACTION_TYPE_LABELS[row.type]}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-charcoal">{row.tourTitle ?? row.bookingId}</p>
                        <p className="mt-1 text-xs text-slate">{row.bookingId}</p>
                        {row.requestReason ? (
                          <p className="mt-1 text-xs text-slate">Причина: {row.requestReason}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-charcoal">
                        {PAYMENT_PROVIDER_LABELS[row.provider]}
                        {row.externalId ? (
                          <p className="mt-1 text-xs text-slate">ID: {row.externalId}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-medium text-charcoal">
                        <FormattedPrice priceUsd={row.amount} />{" "}
                        <span className="text-xs text-slate">{row.currency}</span>
                      </td>
                      <td className="px-4 py-3 text-charcoal">
                        {PAYMENT_TRANSACTION_STATUS_LABELS[row.status]}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/operations/bookings?bookingId=${encodeURIComponent(row.bookingId)}`}
                            className="text-sm font-medium text-sky hover:underline"
                          >
                            Заявка
                          </Link>
                          {row.type === "refund" && row.status === "pending" ? (
                            <>
                              <button
                                type="button"
                                disabled={actionLoadingId === row.id}
                                onClick={() => void handleRefundAction(row.id, "approve")}
                                className="text-sm font-medium text-success hover:underline disabled:opacity-60"
                              >
                                Одобрить
                              </button>
                              <button
                                type="button"
                                disabled={actionLoadingId === row.id}
                                onClick={() => void handleRefundAction(row.id, "reject")}
                                className="text-sm font-medium text-red-600 hover:underline disabled:opacity-60"
                              >
                                Отклонить
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
    </>
  );
}
