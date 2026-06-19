"use client";

import { useState } from "react";
import FormattedPrice from "@/components/FormattedPrice";
import { NativeSelect } from "@/components/ui/native-select";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { AdminPaymentPeriodFilter } from "@/types/admin-payments";
import { ANALYTICS_PERIOD_LABELS } from "@/types/admin-analytics";
import type {
  PayoutRecordRow,
  ReconciliationDiscrepancy,
  ReconciliationSnapshotRow,
  ReconciliationTotals,
} from "@/types/payment-platform";
import { PAYOUT_RECORD_STATUS_LABELS } from "@/types/payment-platform";

type ReconciliationResponse = {
  totals?: ReconciliationTotals;
  discrepancies?: ReconciliationDiscrepancy[];
  payoutSummary?: {
    totalPending: number;
    totalApproved: number;
    totalExported: number;
    totalCompleted: number;
    recordCount: number;
  };
  payouts?: PayoutRecordRow[];
  snapshots?: ReconciliationSnapshotRow[];
};

export function AdminReconciliationPanel() {
  const [period, setPeriod] = useState<AdminPaymentPeriodFilter>("30d");
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotMessage, setSnapshotMessage] = useState<string | null>(null);

  const { data, loading, error, refresh } = useAdminApi<ReconciliationResponse>(
    `/api/admin/payments/reconciliation?period=${period}&snapshots=1`
  );

  const totals = data?.totals;
  const discrepancies = data?.discrepancies ?? [];
  const payoutSummary = data?.payoutSummary;
  const payouts = data?.payouts ?? [];
  const snapshots = data?.snapshots ?? [];

  async function handleCreateSnapshot() {
    setSnapshotLoading(true);
    setSnapshotMessage(null);
    try {
      const response = await fetch(`/api/admin/payments/reconciliation?period=${period}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "snapshot" }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setSnapshotMessage(payload.error ?? "Не удалось сохранить снимок");
        return;
      }
      setSnapshotMessage("Снимок сверки сохранён");
      await refresh();
    } catch {
      setSnapshotMessage("Не удалось сохранить снимок");
    } finally {
      setSnapshotLoading(false);
    }
  }

  return (
    <div className="space-y-6">
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
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          Обновить
        </button>
        <button
          type="button"
          onClick={() => void handleCreateSnapshot()}
          disabled={snapshotLoading || loading}
          className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          Сохранить снимок
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {snapshotMessage ? <p className="text-sm text-charcoal">{snapshotMessage}</p> : null}

        {totals ? (
          <section className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-success-muted px-3 py-1 text-xs font-medium text-success">
              Списания: {totals.chargeCount} · <FormattedPrice priceUsd={totals.chargeAmount} />
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-charcoal">
              Возвраты: {totals.refundCount} · <FormattedPrice priceUsd={totals.refundAmount} />
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-charcoal">
              Выплаты: {totals.payoutCount} · <FormattedPrice priceUsd={totals.payoutAmount} />
            </span>
            <span className="rounded-full bg-sky/10 px-3 py-1 text-xs font-medium text-sky">
              Чистый итог: <FormattedPrice priceUsd={totals.netAmount} />
            </span>
            {totals.pendingRefundCount > 0 ? (
              <span className="rounded-full bg-warning-muted px-3 py-1 text-xs font-medium text-warning">
                Ожидают возврата: {totals.pendingRefundCount}
              </span>
            ) : null}
          </section>
        ) : null}

        {payoutSummary ? (
          <section className={`${cabinetCardClass} p-4 sm:p-6`}>
            <h2 className="font-heading text-base font-bold text-charcoal">Выплаты организаторам</h2>
            <p className="mt-2 text-sm text-slate">
              Записей: {payoutSummary.recordCount}. Ожидают:{" "}
              <FormattedPrice priceUsd={payoutSummary.totalPending} />, одобрено:{" "}
              <FormattedPrice priceUsd={payoutSummary.totalApproved} />, экспортировано:{" "}
              <FormattedPrice priceUsd={payoutSummary.totalExported} />, завершено:{" "}
              <FormattedPrice priceUsd={payoutSummary.totalCompleted} />.
            </p>
            {payouts.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm text-charcoal">
                {payouts.slice(0, 10).map((row) => (
                  <li key={row.id} className="rounded-lg bg-gray-50 px-3 py-2">
                    {row.period} · организатор {row.organizerUserId} ·{" "}
                    <FormattedPrice priceUsd={row.amount} /> ·{" "}
                    {PAYOUT_RECORD_STATUS_LABELS[row.status]}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate">Записей о выплатах пока нет.</p>
            )}
          </section>
        ) : null}

        <section className={`${cabinetCardClass} p-4 sm:p-6`}>
          <h2 className="font-heading text-base font-bold text-charcoal">Расхождения</h2>
          {discrepancies.length === 0 ? (
            <p className="mt-3 text-sm text-slate">
              {loading ? "Загрузка…" : "Расхождений не обнаружено"}
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {discrepancies.map((item, index) => (
                <li
                  key={`${item.transactionId ?? item.bookingId ?? index}`}
                  className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-charcoal"
                >
                  {item.message}
                </li>
              ))}
            </ul>
          )}
        </section>

        {snapshots.length > 0 ? (
          <section className={`${cabinetCardClass} p-4 sm:p-6`}>
            <h2 className="font-heading text-base font-bold text-charcoal">Сохранённые снимки</h2>
            <ul className="mt-4 space-y-2 text-sm text-charcoal">
              {snapshots.map((row) => (
                <li key={row.id} className="rounded-lg bg-gray-50 px-3 py-2">
                  {row.snapshotDate} · период {row.period ?? "—"} · чистый итог{" "}
                  <FormattedPrice priceUsd={row.totals.netAmount} />
                  {row.notes ? ` · ${row.notes}` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
    </div>
  );
}
