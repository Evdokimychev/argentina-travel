"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import FormattedPrice from "@/components/FormattedPrice";
import AdminStatusChip from "@/components/admin/AdminStatusChip";
import { AdminTableState } from "@/components/admin/AdminTableState";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminApi } from "@/hooks/useAdminApi";
import { useAdminLayoutPrefs } from "@/context/AdminLayoutPrefsContext";
import { cabinetCardClass, cabinetTableHeaderClass, cabinetTableWrapClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";
import {
  MERCADOPAGO_CAPTURE_PHASE_LABELS,
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_TRANSACTION_STATUS_LABELS,
  PAYMENT_TRANSACTION_TYPE_LABELS,
  type MercadoPagoCapturePhase,
  type PaymentTransactionReceiptView,
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

type TransactionDetailResponse = {
  transaction?: PaymentTransactionRow;
  receipt?: PaymentTransactionReceiptView;
  livePayment?: Record<string, unknown> | null;
  error?: string;
};

type CreateRefundResponse = {
  error?: string;
  transaction?: PaymentTransactionRow;
  providerAttempt?: {
    executed?: boolean;
    skippedReason?: string | null;
    code?: string;
    error?: string;
  };
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

function formatCapturePhaseLabel(value: unknown): string {
  if (typeof value !== "string") return "—";
  if (value in MERCADOPAGO_CAPTURE_PHASE_LABELS) {
    return MERCADOPAGO_CAPTURE_PHASE_LABELS[value as MercadoPagoCapturePhase];
  }
  return value;
}

function formatAdminDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("ru-RU");
}

export function AdminPaymentLedgerPanel() {
  const { tableClass, thClass, tdClass } = useAdminLayoutPrefs();
  const [period, setPeriod] = useState<AdminPaymentPeriodFilter>("30d");
  const [type, setType] = useState<PaymentTransactionType | "all">("all");
  const [status, setStatus] = useState<PaymentTransactionStatus | "all">("all");
  const [provider, setProvider] = useState<PaymentProviderId | "all">("all");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [createRefundLoading, setCreateRefundLoading] = useState(false);
  const [createRefundMessage, setCreateRefundMessage] = useState<string | null>(null);
  const [createRefundError, setCreateRefundError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TransactionDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const query = `/api/admin/payments/transactions?period=${period}&type=${type}&status=${status}&provider=${provider}`;
  const { data, loading, error, refresh } = useAdminApi<LedgerResponse>(query);

  const transactions = data?.transactions ?? [];
  const selected = transactions.find((row) => row.id === selectedId) ?? detail?.transaction ?? null;

  const loadDetail = useCallback(async (transactionId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await fetch(
        `/api/admin/payments/transactions/${encodeURIComponent(transactionId)}?live=1`
      );
      const payload = (await response.json().catch(() => ({}))) as TransactionDetailResponse & {
        error?: string;
      };
      if (!response.ok) {
        setDetailError(payload.error ?? "Не удалось загрузить детали операции");
        setDetail(null);
        return;
      }
      setDetail(payload);
    } catch {
      setDetailError("Не удалось загрузить детали операции");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedId);
  }, [loadDetail, selectedId]);

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
        if (selectedId === transactionId) {
          await loadDetail(transactionId);
        }
        setCreateRefundMessage(null);
      } catch {
        setActionError("Не удалось выполнить действие");
      } finally {
        setActionLoadingId(null);
      }
    },
    [loadDetail, refresh, selectedId]
  );

  const handleCreateRefund = useCallback(
    async (row: PaymentTransactionRow) => {
      setCreateRefundError(null);
      setCreateRefundMessage(null);
      setCreateRefundLoading(true);
      try {
        const response = await fetch("/api/admin/payments/refund", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: row.bookingId,
            amountUsd: row.amount,
            reason: `Возврат по операции ${row.id}`,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as CreateRefundResponse;
        if (!response.ok || !payload.transaction) {
          setCreateRefundError(payload.error ?? "Не удалось создать запрос на возврат");
          return;
        }

        if (payload.providerAttempt?.executed) {
          setCreateRefundMessage("Возврат отправлен провайдеру");
        } else if (payload.providerAttempt?.skippedReason) {
          setCreateRefundMessage("Запрос создан и ожидает ручной обработки");
        } else if (payload.providerAttempt?.error) {
          setCreateRefundMessage("Запрос создан, но провайдер вернул ошибку");
        } else {
          setCreateRefundMessage("Запрос на возврат создан");
        }

        await refresh();
        setSelectedId(payload.transaction.id);
        await loadDetail(payload.transaction.id);
      } catch {
        setCreateRefundError("Не удалось создать запрос на возврат");
      } finally {
        setCreateRefundLoading(false);
      }
    },
    [loadDetail, refresh]
  );

  const receiptMeta = detail?.receipt?.receipt ?? null;

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
          <table className={cn("w-full min-w-[1100px] text-left", tableClass)}>
            <thead className={cabinetTableHeaderClass}>
              <tr>
                <th className={thClass}>Дата</th>
                <th className={thClass}>Тип</th>
                <th className={thClass}>Бронирование</th>
                <th className={thClass}>Провайдер</th>
                <th className={thClass}>Сумма</th>
                <th className={thClass}>Статус</th>
                <th className={thClass}>Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading || transactions.length === 0 ? (
                <AdminTableState
                  loading={loading}
                  isEmpty={transactions.length === 0}
                  colSpan={7}
                  skeletonColumns={7}
                  emptyIcon={Receipt}
                  emptyTitle="Операции не найдены"
                  emptyDescription="Измените фильтры периода или статуса транзакции."
                />
              ) : (
                transactions.map((row) => (
                  <tr key={row.id} className={selectedId === row.id ? "bg-sky/5" : undefined}>
                    <td className={cn(tdClass, "text-slate")}>
                      {new Date(row.createdAt).toLocaleString("ru-RU")}
                    </td>
                    <td className={cn(tdClass, "text-charcoal")}>
                      {PAYMENT_TRANSACTION_TYPE_LABELS[row.type]}
                    </td>
                    <td className={tdClass}>
                      <p className="font-medium text-charcoal">{row.tourTitle ?? row.bookingId}</p>
                      <p className="mt-1 text-xs text-slate">{row.bookingId}</p>
                      {row.requestReason ? (
                        <p className="mt-1 text-xs text-slate">Причина: {row.requestReason}</p>
                      ) : null}
                    </td>
                    <td className={cn(tdClass, "text-charcoal")}>
                      {PAYMENT_PROVIDER_LABELS[row.provider]}
                      {row.externalId ? (
                        <p className="mt-1 text-xs text-slate">ID: {row.externalId}</p>
                      ) : null}
                    </td>
                    <td className={cn(tdClass, "font-medium text-charcoal")}>
                      <FormattedPrice priceUsd={row.amount} />{" "}
                      <span className="text-xs text-slate">{row.currency}</span>
                    </td>
                    <td className={tdClass}>
                      <AdminStatusChip domain="payment-transaction" value={row.status} />
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedId(row.id)}
                          className="text-sm font-medium text-brand hover:underline"
                        >
                          Детали
                        </button>
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

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-2xl" showClose>
          <DialogHeader>
            <DialogTitle>Детали платёжной операции</DialogTitle>
            <DialogDescription>
              {selected ? `${PAYMENT_TRANSACTION_TYPE_LABELS[selected.type]} · ${selected.id}` : ""}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <p className="px-5 py-8 text-sm text-slate sm:px-6">Загрузка…</p>
          ) : detailError ? (
            <p className="px-5 py-8 text-sm text-red-600 sm:px-6">{detailError}</p>
          ) : selected ? (
            <div className="space-y-4 px-5 pb-6 sm:px-6">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate">Сумма</dt>
                  <dd className="mt-0.5 font-medium text-charcoal">
                    <FormattedPrice priceUsd={selected.amount} /> {selected.currency}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate">Статус журнала</dt>
                  <dd className="mt-0.5">
                    <AdminStatusChip domain="payment-transaction" value={selected.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-slate">Провайдер</dt>
                  <dd className="mt-0.5 font-medium text-charcoal">
                    {PAYMENT_PROVIDER_LABELS[selected.provider]}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate">Создано</dt>
                  <dd className="mt-0.5 font-medium text-charcoal">
                    {formatAdminDateTime(selected.createdAt)}
                  </dd>
                </div>
                {selected.externalId ? (
                  <div className="sm:col-span-2">
                    <dt className="text-slate">ID провайдера</dt>
                    <dd className="mt-0.5 break-all font-mono text-charcoal">{selected.externalId}</dd>
                  </div>
                ) : null}
                {receiptMeta?.capturePhase ? (
                  <div>
                    <dt className="text-slate">Фаза списания</dt>
                    <dd className="mt-0.5 font-medium text-charcoal">
                      {MERCADOPAGO_CAPTURE_PHASE_LABELS[receiptMeta.capturePhase]}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {detail?.livePayment ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate">
                    {detail.livePayment.provider === "stripe"
                      ? "Данные Stripe (live)"
                      : "Данные Mercado Pago (live)"}
                  </p>
                  {"error" in detail.livePayment ? (
                    <p className="mt-2 text-sm text-red-600">
                      {String(detail.livePayment.error)}
                    </p>
                  ) : (
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-slate">
                          {detail.livePayment.provider === "stripe" ? "Статус Stripe" : "Статус MP"}
                        </dt>
                        <dd className="font-medium text-charcoal">
                          {String(detail.livePayment.status ?? "—")}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate">Фаза</dt>
                        <dd className="font-medium text-charcoal">
                          {formatCapturePhaseLabel(detail.livePayment.capturePhase)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate">Подтверждено</dt>
                        <dd className="font-medium text-charcoal">
                          {formatAdminDateTime(
                            typeof detail.livePayment.dateApproved === "string"
                              ? detail.livePayment.dateApproved
                              : null
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate">
                          {detail.livePayment.provider === "stripe"
                            ? "Создано в Stripe"
                            : "Создано в MP"}
                        </dt>
                        <dd className="font-medium text-charcoal">
                          {formatAdminDateTime(
                            typeof detail.livePayment.dateCreated === "string"
                              ? detail.livePayment.dateCreated
                              : null
                          )}
                        </dd>
                      </div>
                    </dl>
                  )}
                </div>
              ) : null}

              {selected.requestReason ? (
                <p className="text-sm text-slate">
                  <span className="font-medium text-charcoal">Причина запроса:</span>{" "}
                  {selected.requestReason}
                </p>
              ) : null}
              {selected.adminNotes ? (
                <p className="text-sm text-slate">
                  <span className="font-medium text-charcoal">Заметки администратора:</span>{" "}
                  {selected.adminNotes}
                </p>
              ) : null}

              {selected.type === "charge" && selected.status === "completed" ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-charcoal">Возврат по операции списания</p>
                  <p className="mt-1 text-xs text-slate">
                    Создаётся запрос на полный возврат с последующей попыткой отправки в платёжную
                    систему.
                  </p>
                  {createRefundError ? (
                    <p className="mt-2 text-sm text-red-600">{createRefundError}</p>
                  ) : null}
                  {createRefundMessage ? (
                    <p className="mt-2 text-sm text-success">{createRefundMessage}</p>
                  ) : null}
                  <button
                    type="button"
                    disabled={createRefundLoading}
                    onClick={() => void handleCreateRefund(selected)}
                    className="mt-3 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-charcoal hover:bg-gray-100 disabled:opacity-60"
                  >
                    {createRefundLoading ? "Создаём…" : "Создать запрос на возврат"}
                  </button>
                </div>
              ) : null}

              {selected.type === "refund" && selected.status === "pending" ? (
                <div className="flex flex-wrap gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <button
                    type="button"
                    disabled={actionLoadingId === selected.id}
                    onClick={() => void handleRefundAction(selected.id, "approve")}
                    className="rounded-xl border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                  >
                    Одобрить возврат
                  </button>
                  <button
                    type="button"
                    disabled={actionLoadingId === selected.id}
                    onClick={() => void handleRefundAction(selected.id, "reject")}
                    className="rounded-xl border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                  >
                    Отклонить
                  </button>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href={`/admin/operations/bookings?bookingId=${encodeURIComponent(selected.bookingId)}`}
                  className="text-sm font-medium text-sky hover:underline"
                >
                  Открыть заявку
                </Link>
                <button
                  type="button"
                  onClick={() => selectedId && void loadDetail(selectedId)}
                  className="text-sm font-medium text-charcoal hover:underline"
                >
                  {selected?.provider === "stripe"
                    ? "Обновить данные Stripe"
                    : "Обновить данные MP"}
                </button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
