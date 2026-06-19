"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import FormattedPrice from "@/components/FormattedPrice";
import { isRemoteBookingsMode } from "@/lib/bookings-api";
import {
  PAYMENT_TRANSACTION_STATUS_LABELS,
  type PaymentTransactionRow,
} from "@/types/payment-platform";
import type { BookingPaymentStatus } from "@/types/booking-params";

type Props = {
  bookingId: string;
  paymentStatus: BookingPaymentStatus;
  paidAmountUsd: number;
  role?: "tourist" | "organizer";
};

function statusTone(status: PaymentTransactionRow["status"]): string {
  if (status === "completed") return "bg-emerald-50 text-emerald-900 ring-emerald-200";
  if (status === "pending" || status === "processing") {
    return "bg-amber-50 text-amber-900 ring-amber-200";
  }
  if (status === "rejected" || status === "failed" || status === "cancelled") {
    return "bg-rose-50 text-rose-900 ring-rose-200";
  }
  return "bg-gray-100 text-slate-700 ring-gray-200";
}

export default function BookingRefundRequestSection({
  bookingId,
  paymentStatus,
  paidAmountUsd,
  role = "tourist",
}: Props) {
  const [reason, setReason] = useState("");
  const [latest, setLatest] = useState<PaymentTransactionRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canRequestByStatus =
    role === "organizer"
      ? paymentStatus === "paid"
      : paymentStatus === "paid" || paymentStatus === "partial";
  const canRequest = isRemoteBookingsMode() && canRequestByStatus && paidAmountUsd > 0;

  const loadRefundState = useCallback(async () => {
    if (!isRemoteBookingsMode()) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/payment/refund`);
      if (!response.ok) return;
      const payload = (await response.json()) as {
        pendingRefund?: PaymentTransactionRow | null;
        latestRefund?: PaymentTransactionRow | null;
      };
      setLatest(payload.latestRefund ?? payload.pendingRefund ?? null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (isRemoteBookingsMode()) {
      void loadRefundState();
    }
  }, [loadRefundState]);

  const activeRefund = latest?.status === "pending" || latest?.status === "processing";
  const isCompleted = latest?.status === "completed";
  const canSubmit = canRequest && !activeRefund && !isCompleted;

  if (!canRequest && !latest) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const endpoint =
        role === "organizer"
          ? "/api/organizer/payments/refund-request"
          : `/api/bookings/${encodeURIComponent(bookingId)}/payment/refund`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          reason: reason.trim(),
          amountUsd: paidAmountUsd,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        transaction?: PaymentTransactionRow;
        providerAttempt?: {
          executed?: boolean;
          skippedReason?: string | null;
        };
      };
      if (!response.ok) {
        setError(payload.error ?? "Не удалось отправить запрос");
        return;
      }
      setLatest(payload.transaction ?? null);
      if (payload.providerAttempt?.executed) {
        setMessage("Запрос отправлен, возврат передан в платёжную систему");
      } else if (payload.providerAttempt?.skippedReason) {
        setMessage("Запрос отправлен, ожидается ручная обработка администратором");
      } else {
        setMessage("Запрос на возврат отправлен администратору");
      }
      setReason("");
    } catch {
      setError("Не удалось отправить запрос");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-slate">
        Проверяем возврат…
      </div>
    );
  }

  if (activeRefund && latest) {
    return (
      <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-charcoal">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">Запрос на возврат в обработке</p>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ring-1 ${statusTone(latest.status)}`}>
            {PAYMENT_TRANSACTION_STATUS_LABELS[latest.status]}
          </span>
        </div>
        <p className="mt-1 text-slate">
          Сумма: <FormattedPrice priceUsd={latest.amount} />
        </p>
        {latest.requestReason ? (
          <p className="mt-1 text-slate">Причина: {latest.requestReason}</p>
        ) : null}
      </div>
    );
  }

  const latestStatusLine = latest ? (
    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-charcoal">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">Последний запрос на возврат</p>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ring-1 ${statusTone(latest.status)}`}>
          {PAYMENT_TRANSACTION_STATUS_LABELS[latest.status]}
        </span>
      </div>
      <p className="mt-1 text-slate">
        Сумма: <FormattedPrice priceUsd={latest.amount} />
      </p>
      {latest.requestReason ? (
        <p className="mt-1 text-slate">Причина: {latest.requestReason}</p>
      ) : null}
      {latest.adminNotes ? <p className="mt-1 text-slate">Комментарий: {latest.adminNotes}</p> : null}
    </div>
  ) : null;

  if (!canSubmit) {
    return latestStatusLine;
  }

  return (
    <div className="space-y-3">
      {latestStatusLine}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-4">
        <div className="flex items-start gap-3">
          <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-slate" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-charcoal">Запросить возврат</p>
            <p className="mt-1 text-sm text-slate">
              Администратор рассмотрит запрос. Автоматический возврат через платёжную систему
              выполняется только при настроенных учётных данных.
            </p>
            <form onSubmit={(event) => void handleSubmit(event)} className="mt-3 space-y-3">
              <label className="block text-sm text-charcoal">
                <span className="mb-1 block text-slate">Причина (необязательно)</span>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Кратко опишите причину возврата"
                />
              </label>
              <p className="text-sm text-slate">
                Сумма к возврату: <FormattedPrice priceUsd={paidAmountUsd} />
              </p>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {message ? <p className="text-sm text-success">{message}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-charcoal hover:bg-gray-50 disabled:opacity-60"
              >
                {submitting ? "Отправка…" : "Отправить запрос"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
