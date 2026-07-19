"use client";

import { useState } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { formatLedgerAmount } from "@/lib/payments/format-money";
import type { AdminPaymentPeriodFilter } from "@/types/admin-payments";
import { ANALYTICS_PERIOD_LABELS } from "@/types/admin-analytics";
import type {
  PayoutRecordRow,
  PayoutSummary,
  ReconciliationDiscrepancy,
  ReconciliationSnapshotRow,
  ReconciliationTotals,
} from "@/types/payment-platform";
import { PAYOUT_RECORD_STATUS_LABELS } from "@/types/payment-platform";

type ReconciliationResponse = {
  totals?: ReconciliationTotals;
  discrepancies?: ReconciliationDiscrepancy[];
  payoutSummary?: PayoutSummary;
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
          <section className="space-y-3">
            {totals.byCurrency.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {totals.byCurrency.map((bucket) => (
                  <article key={bucket.currency} className={`${cabinetCardClass} p-4`}>
                    <h2 className="font-heading text-base font-bold text-charcoal">
                      {bucket.currency}
                    </h2>
                    <dl className="mt-3 space-y-2 text-sm text-slate">
                      <div className="flex justify-between gap-3">
                        <dt>Списания · {bucket.chargeCount}</dt>
                        <dd className="font-medium text-charcoal">
                          {formatLedgerAmount(bucket.chargeAmount, bucket.currency)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Возвраты · {bucket.refundCount}</dt>
                        <dd className="font-medium text-charcoal">
                          {formatLedgerAmount(bucket.refundAmount, bucket.currency)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Выплаты · {bucket.payoutCount}</dt>
                        <dd className="font-medium text-charcoal">
                          {formatLedgerAmount(bucket.payoutAmount, bucket.currency)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 border-t border-gray-100 pt-2">
                        <dt>Чистый итог</dt>
                        <dd className="font-semibold text-sky-ink">
                          {formatLedgerAmount(bucket.netAmount, bucket.currency)}
                        </dd>
                      </div>
                    </dl>
                    {bucket.pendingRefundCount > 0 ? (
                      <p className="mt-3 text-xs font-medium text-warning">
                        Ожидают возврата: {bucket.pendingRefundCount}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate">Денежных операций за период нет.</p>
            )}
            {totals.invalidRecordCount > 0 ? (
              <p className="rounded-xl bg-error-muted px-3 py-2 text-sm text-error">
                Не включено некорректных записей: {totals.invalidRecordCount}. Проверьте журнал
                расхождений.
              </p>
            ) : null}
          </section>
        ) : null}

        {payoutSummary ? (
          <section className={`${cabinetCardClass} p-4 sm:p-6`}>
            <h2 className="font-heading text-base font-bold text-charcoal">Выплаты организаторам</h2>
            <p className="mt-2 text-sm text-slate">Записей: {payoutSummary.recordCount}.</p>
            <ul className="mt-3 space-y-2 text-sm text-slate">
              {payoutSummary.byCurrency.map((bucket) => (
                <li key={bucket.currency} className="rounded-lg bg-gray-50 px-3 py-2">
                  <span className="font-semibold text-charcoal">{bucket.currency}</span> · ожидают{" "}
                  {formatLedgerAmount(bucket.totalPending, bucket.currency)} · одобрено{" "}
                  {formatLedgerAmount(bucket.totalApproved, bucket.currency)} · экспортировано{" "}
                  {formatLedgerAmount(bucket.totalExported, bucket.currency)} · завершено{" "}
                  {formatLedgerAmount(bucket.totalCompleted, bucket.currency)}
                </li>
              ))}
            </ul>
            {payoutSummary.invalidRecordCount > 0 ? (
              <p className="mt-3 rounded-xl bg-error-muted px-3 py-2 text-sm text-error">
                Не включено некорректных выплат: {payoutSummary.invalidRecordCount}. Проверьте
                исходные записи перед формированием пакета выплат.
              </p>
            ) : null}
            {payouts.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm text-charcoal">
                {payouts.slice(0, 10).map((row) => (
                  <li key={row.id} className="rounded-lg bg-gray-50 px-3 py-2">
                    {row.period} · организатор {row.organizerUserId} ·{" "}
                    {formatLedgerAmount(row.amount, row.currency)} ·{" "}
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
                  {row.snapshotDate} · период {row.period ?? "—"} ·{" "}
                  {row.totals.legacyUnknownCurrency
                    ? "валютная разбивка старого снимка неизвестна"
                    : row.totals.byCurrency
                        .map(
                          (bucket) =>
                            `${bucket.currency}: ${formatLedgerAmount(bucket.netAmount, bucket.currency)}`,
                        )
                        .join(" · ") || "операций нет"}
                  {row.notes ? ` · ${row.notes}` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
    </div>
  );
}
