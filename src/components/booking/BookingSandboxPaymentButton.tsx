"use client";

import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  apiFetchPaymentSandboxMode,
  apiSimulateSandboxPayment,
  isRemoteBookingsMode,
} from "@/lib/bookings-api";
import { resolveBookingPaymentStatus } from "@/lib/booking-params";
import { simulateSandboxPaymentLocal } from "@/lib/bookings-store";
import type { Booking } from "@/types/tourist";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";
import FormattedPrice from "@/components/FormattedPrice";
import InlineFeedback from "@/components/feedback/InlineFeedback";

export default function BookingSandboxPaymentButton({
  booking,
  onUpdated,
}: {
  booking: Booking;
  onUpdated?: (booking: Booking) => void;
}) {
  const [sandboxEnabled, setSandboxEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const paymentStatus = resolveBookingPaymentStatus(booking);
  const canSimulate = paymentStatus === "pending" || paymentStatus === "partial";

  useEffect(() => {
    if (isRemoteBookingsMode()) {
      void apiFetchPaymentSandboxMode()
        .then((payload) => setSandboxEnabled(payload.enabled))
        .catch(() => setSandboxEnabled(false));
      return;
    }

    setSandboxEnabled(process.env.NODE_ENV === "development");
  }, []);

  if (!sandboxEnabled || !canSimulate) return null;

  async function handleSimulate(asPartial: boolean) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isRemoteBookingsMode()) {
        const result = await apiSimulateSandboxPayment({
          bookingId: booking.id,
          asPartial,
        });
        onUpdated?.(result.booking);
        window.dispatchEvent(new Event(BOOKINGS_UPDATED_EVENT));
        setSuccess(
          result.paymentStatus === "paid"
            ? "Симуляция: заявка отмечена как полностью оплаченная."
            : "Симуляция: зафиксирована частичная оплата."
        );
        return;
      }

      const result = simulateSandboxPaymentLocal({ bookingId: booking.id, asPartial });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onUpdated?.(result.booking);
      window.dispatchEvent(new Event(BOOKINGS_UPDATED_EVENT));
      setSuccess(
        resolveBookingPaymentStatus(result.booking) === "paid"
          ? "Симуляция: заявка отмечена как полностью оплаченная."
          : "Симуляция: зафиксирована частичная оплата."
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось выполнить симуляцию");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-violet-300/80 bg-violet-50/40 px-4 py-3">
      <div className="flex flex-wrap items-start gap-3">
        <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-charcoal">Песочница оплат (демо)</p>
          <p className="text-sm text-slate">
            Симулирует успешное списание без Mercado Pago и Stripe. Создаёт запись в журнале
            платежей и снимок комиссии для организатора.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={loading}
              onClick={() => void handleSimulate(false)}
            >
              Симулировать полную оплату
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => void handleSimulate(true)}
            >
              Симулировать депозит
            </Button>
          </div>
          {success ? <InlineFeedback variant="success" title={success} /> : null}
          {error ? <InlineFeedback variant="error" title={error} /> : null}
          {booking.totalPriceUsd > 0 ? (
            <p className="text-xs text-slate">
              Сумма тура: <FormattedPrice priceUsd={booking.totalPriceUsd} className="inline" />
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
