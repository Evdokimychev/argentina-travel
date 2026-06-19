"use client";

import { useState } from "react";
import { Download, Wallet } from "lucide-react";
import FormattedPrice from "@/components/FormattedPrice";
import { AdminTableState } from "@/components/admin/AdminTableState";
import { NativeSelect } from "@/components/ui/native-select";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass, cabinetTableHeaderClass } from "@/lib/cabinet-ui";
import { CabinetTableWrap } from "@/components/ui/table";
import type { AdminPaymentPeriodFilter } from "@/types/admin-payments";
import { ANALYTICS_PERIOD_LABELS } from "@/types/admin-analytics";
import type { CommissionReportTotals } from "@/types/platform-commission";
import type { PayoutRecordRow } from "@/types/payment-platform";
import { PAYOUT_RECORD_STATUS_LABELS } from "@/types/payment-platform";

type PayoutsApiResponse = {
  payouts?: PayoutRecordRow[];
  payoutSummary?: {
    totalPending: number;
    totalApproved: number;
    totalExported: number;
    totalCompleted: number;
    recordCount: number;
  };
  commissionReport?: CommissionReportTotals;
  error?: string;
};

export function AdminPayoutsPanel() {
  const [period, setPeriod] = useState<AdminPaymentPeriodFilter>("30d");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [organizerUserId, setOrganizerUserId] = useState("");

  const query = `/api/admin/payments/payouts?period=${period}&status=${statusFilter}`;
  const { data, loading, error, refresh } = useAdminApi<PayoutsApiResponse>(query);

  const payouts = data?.payouts ?? [];
  const payoutSummary = data?.payoutSummary;
  const commissionReport = data?.commissionReport;

  async function runAction(
    action: "approve" | "complete" | "cancel" | "create_batch",
    payoutId?: string
  ) {
    setActionLoading(payoutId ?? action);
    setMessage(null);
    try {
      const body: Record<string, string> = { action };
      if (payoutId) body.payoutId = payoutId;
      if (action === "create_batch" && organizerUserId.trim()) {
        body.organizerUserId = organizerUserId.trim();
      }

      const response = await fetch("/api/admin/payments/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "Не удалось выполнить действие");
        return;
      }
      setMessage(
        action === "approve"
          ? "Пакет одобрен — можно экспортировать CSV для банковского перевода"
          : action === "complete"
            ? "Перевод отмечен как завершённый (ручное подтверждение)"
            : action === "cancel"
              ? "Пакет выплаты отменён"
              : "Пакет выплаты создан"
      );
      await refresh();
    } catch {
      setMessage("Не удалось выполнить действие");
    } finally {
      setActionLoading(null);
    }
  }

  async function exportBatch(payoutId: string, currentStatus: PayoutRecordRow["status"]) {
    setActionLoading(`export-${payoutId}`);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/payments/payouts/${payoutId}/export`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setMessage(payload.error ?? "Не удалось экспортировать пакет");
        return;
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `payout-${payoutId.slice(0, 8)}.csv`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(
        currentStatus === "approved"
          ? "CSV экспортирован — пакет переведён в статус «экспортировано»"
          : "CSV повторно скачан"
      );
      await refresh();
    } catch {
      setMessage("Не удалось экспортировать пакет");
    } finally {
      setActionLoading(null);
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
        <NativeSelect
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="w-44"
        >
          <option value="all">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="approved">Одобрено</option>
          <option value="exported">Экспортировано</option>
          <option value="completed">Завершено</option>
          <option value="cancelled">Отменено</option>
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
      {message ? <p className="text-sm text-charcoal">{message}</p> : null}

      {commissionReport ? (
        <section className={`${cabinetCardClass} p-4 sm:p-6`}>
          <h2 className="font-heading text-base font-bold text-charcoal">Отчёт по комиссиям</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-charcoal">
              Начислений: {commissionReport.snapshotCount}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-charcoal">
              Организаторов: {commissionReport.organizerCount}
            </span>
            <span className="rounded-full bg-success-muted px-3 py-1 text-xs font-medium text-success">
              Брутто: <FormattedPrice priceUsd={commissionReport.grossTotal} />
            </span>
            <span className="rounded-full bg-sky/10 px-3 py-1 text-xs font-medium text-sky">
              Комиссия: <FormattedPrice priceUsd={commissionReport.commissionTotal} />
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-charcoal">
              Нетто организаторов:{" "}
              <FormattedPrice priceUsd={commissionReport.organizerNetTotal} />
            </span>
          </div>
        </section>
      ) : null}

      {payoutSummary ? (
        <section className={`${cabinetCardClass} p-4 sm:p-6`}>
          <h2 className="font-heading text-base font-bold text-charcoal">Сводка выплат</h2>
          <p className="mt-2 text-sm text-slate">
            Записей: {payoutSummary.recordCount}. Ожидают:{" "}
            <FormattedPrice priceUsd={payoutSummary.totalPending} />, одобрено:{" "}
            <FormattedPrice priceUsd={payoutSummary.totalApproved} />, экспортировано:{" "}
            <FormattedPrice priceUsd={payoutSummary.totalExported} />, завершено:{" "}
            <FormattedPrice priceUsd={payoutSummary.totalCompleted} />.
          </p>
          <p className="mt-1 text-xs text-slate">
            Цепочка: ожидает → одобрено → экспортировано → завершено (банковский перевод вне
            системы).
          </p>
        </section>
      ) : null}

      <section className={`${cabinetCardClass} p-4 sm:p-6`}>
        <h2 className="font-heading text-base font-bold text-charcoal">Создать пакет выплаты</h2>
        <p className="mt-1 text-sm text-slate">
          Собирает все неоплаченные начисления организатора в пакет со статусом «ожидает». Без
          банковского перевода.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="text"
            value={organizerUserId}
            onChange={(event) => setOrganizerUserId(event.target.value)}
            placeholder="ID организатора"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={actionLoading === "create_batch" || !organizerUserId.trim()}
            onClick={() => void runAction("create_batch")}
            className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            Создать пакет
          </button>
        </div>
      </section>

      <section className={`${cabinetCardClass} space-y-4 p-4 sm:p-6`}>
        <h2 className="font-heading text-base font-bold text-charcoal">Пакеты выплат</h2>
        <CabinetTableWrap>
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className={cabinetTableHeaderClass}>
              <tr>
                <th className="px-4 py-3 font-medium text-slate">Период</th>
                <th className="px-4 py-3 font-medium text-slate">Организатор</th>
                <th className="px-4 py-3 font-medium text-slate">Статус</th>
                <th className="px-4 py-3 font-medium text-slate">Сумма</th>
                <th className="px-4 py-3 font-medium text-slate">Экспорт</th>
                <th className="px-4 py-3 font-medium text-slate">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading || payouts.length === 0 ? (
                <AdminTableState
                  loading={loading}
                  isEmpty={payouts.length === 0}
                  colSpan={6}
                  skeletonColumns={6}
                  emptyIcon={Wallet}
                  emptyTitle="Пакеты выплат не найдены"
                  emptyDescription="За выбранный период выплат организаторам нет."
                />
              ) : (
                payouts.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-charcoal">{row.period}</td>
                    <td className="px-4 py-3 text-charcoal">{row.organizerUserId}</td>
                    <td className="px-4 py-3">
                      {PAYOUT_RECORD_STATUS_LABELS[row.status]}
                    </td>
                    <td className="px-4 py-3 font-medium text-charcoal">
                      <FormattedPrice priceUsd={row.amount} /> {row.currency}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate">
                      {row.exportedAt ? (
                        <span title={row.exportFileHash ?? undefined}>
                          {new Date(row.exportedAt).toLocaleString("ru-RU")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <PayoutRowActions
                        row={row}
                        actionLoading={actionLoading}
                        onApprove={() => void runAction("approve", row.id)}
                        onExport={() => void exportBatch(row.id, row.status)}
                        onComplete={() => void runAction("complete", row.id)}
                        onCancel={() => void runAction("cancel", row.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CabinetTableWrap>
      </section>
    </div>
  );
}

function PayoutRowActions({
  row,
  actionLoading,
  onApprove,
  onExport,
  onComplete,
  onCancel,
}: {
  row: PayoutRecordRow;
  actionLoading: string | null;
  onApprove: () => void;
  onExport: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const busy = actionLoading === row.id || actionLoading === `export-${row.id}`;

  if (row.status === "cancelled" || row.status === "completed" || row.status === "paid") {
    return <span className="text-xs text-slate">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(row.status === "pending" || row.status === "scheduled") && (
        <button
          type="button"
          disabled={busy}
          onClick={onApprove}
          className="text-sm font-medium text-sky hover:underline disabled:opacity-60"
        >
          Одобрить
        </button>
      )}
      {(row.status === "approved" || row.status === "exported") && (
        <button
          type="button"
          disabled={busy}
          onClick={onExport}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline disabled:opacity-60"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          CSV
        </button>
      )}
      {row.status === "exported" && (
        <button
          type="button"
          disabled={busy}
          onClick={onComplete}
          className="text-sm font-medium text-success hover:underline disabled:opacity-60"
        >
          Подтвердить перевод
        </button>
      )}
      {row.status !== "exported" && (
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="text-sm font-medium text-slate hover:underline disabled:opacity-60"
        >
          Отменить
        </button>
      )}
    </div>
  );
}
