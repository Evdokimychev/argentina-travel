"use client";

import FormattedPrice from "@/components/FormattedPrice";
import {
  MERCADOPAGO_CAPTURE_PHASE_LABELS,
  PAYMENT_PROVIDER_LABELS,
  type PaymentTransactionReceiptView,
} from "@/types/payment-platform";

function formatReceiptDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export default function BookingPaymentReceiptSection({
  receipt,
  compact = false,
}: {
  receipt: PaymentTransactionReceiptView;
  compact?: boolean;
}) {
  const paidAt = formatReceiptDate(receipt.paidAt);
  const providerRef = receipt.receipt?.providerPaymentId ?? receipt.externalId;
  const capturePhase = receipt.receipt?.capturePhase;

  return (
    <section
      className={
        compact
          ? "rounded-xl border border-gray-200 bg-gray-50 px-4 py-4"
          : "rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 sm:p-6"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate">Квитанция об оплате</p>
          <p className="mt-1 font-heading text-lg font-bold text-charcoal">
            <FormattedPrice priceUsd={receipt.amount} />{" "}
            <span className="text-sm font-normal text-slate">{receipt.currency}</span>
          </p>
        </div>
        {capturePhase ? (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-charcoal ring-1 ring-gray-200">
            {MERCADOPAGO_CAPTURE_PHASE_LABELS[capturePhase]}
          </span>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        {paidAt ? (
          <div>
            <dt className="text-slate">Дата оплаты</dt>
            <dd className="mt-0.5 font-medium text-charcoal">{paidAt}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-slate">Провайдер</dt>
          <dd className="mt-0.5 font-medium text-charcoal">
            {PAYMENT_PROVIDER_LABELS[receipt.provider]}
          </dd>
        </div>
        {providerRef ? (
          <div className="sm:col-span-2">
            <dt className="text-slate">Номер операции провайдера</dt>
            <dd className="mt-0.5 break-all font-mono text-sm text-charcoal">{providerRef}</dd>
          </div>
        ) : null}
        {receipt.receipt?.authorizationCode ? (
          <div>
            <dt className="text-slate">Код авторизации</dt>
            <dd className="mt-0.5 font-medium text-charcoal">{receipt.receipt.authorizationCode}</dd>
          </div>
        ) : null}
        {receipt.receipt?.paymentMethodId ? (
          <div>
            <dt className="text-slate">Способ оплаты</dt>
            <dd className="mt-0.5 font-medium text-charcoal">{receipt.receipt.paymentMethodId}</dd>
          </div>
        ) : null}
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-slate">
        Данные получены из журнала платёжных операций платформы. Окончательный статус подтверждается
        только после обработки уведомления от Mercado Pago.
      </p>
    </section>
  );
}
