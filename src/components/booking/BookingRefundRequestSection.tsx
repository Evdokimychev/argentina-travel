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
};

export default function BookingRefundRequestSection({
  bookingId,
  paymentStatus,
  paidAmountUsd,
}: Props) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<PaymentTransactionRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canRequest =
    isRemoteBookingsMode() &&
    (paymentStatus === "paid" || paymentStatus === "partial") &&
    paidAmountUsd > 0;

  const loadPending = useCallback(async () => {
    if (!isRemoteBookingsMode()) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/payment/refund`);
      if (!response.ok) return;
      const payload = (await response.json()) as { pendingRefund?: PaymentTransactionRow | null };
      setPending(payload.pendingRefund ?? null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (canRequest) void loadPending();
  }, [canRequest, loadPending]);

  if (!canRequest) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/payment/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim(), amountUsd: paidAmountUsd }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        transaction?: PaymentTransactionRow;
      };
      if (!response.ok) {
        setError(payload.error ?? "Не удалось отправить запрос");
        return;
      }
      setPending(payload.transaction ?? null);
      setMessage("Запрос на возврат отправлен администратору");
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
        Проверяем статус возврата…
      </div>
    );
  }

  if (pending) {
    return (
      <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-charcoal">
        <p className="font-medium">Запрос на возврат на рассмотрении</p>
        <p className="mt-1 text-slate">
          Сумма: <FormattedPrice priceUsd={pending.amount} /> · статус:{" "}
          {PAYMENT_TRANSACTION_STATUS_LABELS[pending.status]}
        </p>
        {pending.requestReason ? (
          <p className="mt-1 text-slate">Причина: {pending.requestReason}</p>
        ) : null}
      </div>
    );
  }

  return (
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
  );
}
