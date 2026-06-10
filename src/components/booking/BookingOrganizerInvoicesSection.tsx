"use client";

import { useEffect, useState } from "react";
import { type ReactNode } from "react";
import { Check, Clock3, Copy, Link2, Percent, Trash2 } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import type { Booking } from "@/types/tourist";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";
import type { BookingInvoice } from "@/types/booking-payment";
import {
  getBookingInvoiceTitle,
  resolveBookingInvoices,
  resolveBookingPaymentSummary,
} from "@/lib/booking-payment";
import {
  buildBookingPaymentLinkUrl,
  formatBookingPaymentLinkStatus,
  shouldShowOrganizerPaymentLink,
} from "@/lib/booking-payment-link";
import { generateOrganizerBookingPaymentLink, getBookingById } from "@/lib/bookings-store";
import { useAuth } from "@/context/AuthContext";
import FormattedPrice from "@/components/FormattedPrice";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

function formatInvoiceDate(iso: string): string {
  const parsed = parseISO(iso);
  if (!isValid(parsed)) return iso;
  return format(parsed, "d MMM yyyy 'г.'", { locale: ru });
}

function InvoiceStatusIcon({ status }: { status: BookingInvoice["status"] }) {
  const isPaid = status === "paid";
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        isPaid ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
      )}
    >
      {isPaid ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Clock3 className="h-4 w-4" />}
    </span>
  );
}

function SummaryStat({
  icon,
  iconClassName,
  label,
  valueUsd,
}: {
  icon: ReactNode;
  iconClassName: string;
  label: string;
  valueUsd: number;
}) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <span
        className={cn(
          "mx-auto flex h-9 w-9 items-center justify-center rounded-full",
          iconClassName
        )}
      >
        {icon}
      </span>
      <p className="mt-2 text-[11px] leading-tight text-slate">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-charcoal">
        <FormattedPrice priceUsd={valueUsd} />
      </p>
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: BookingInvoice }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-white/70 px-3 py-3 ring-1 ring-cyan-100/80">
      <InvoiceStatusIcon status={invoice.status} />
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-snug text-slate">{getBookingInvoiceTitle(invoice)}</p>
        <p className="mt-1 text-sm font-semibold text-charcoal">
          №{invoice.number} от {formatInvoiceDate(invoice.createdAt)}
        </p>
        <p className="mt-1 text-xs text-slate">
          Сумма: <FormattedPrice priceUsd={invoice.amountUsd} className="font-medium text-charcoal" />
          {" · "}
          Оплачено:{" "}
          <FormattedPrice priceUsd={invoice.paidAmountUsd} className="font-medium text-charcoal" />
        </p>
      </div>
      <button
        type="button"
        disabled
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate/40"
        aria-label="Удалить счет"
        title="Удаление счетов будет доступно позже"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function BookingOrganizerInvoicesSection({ booking }: { booking: Booking }) {
  const { user } = useAuth();
  const [currentBooking, setCurrentBooking] = useState(booking);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setCurrentBooking(booking);
    if (booking.paymentLink?.token) {
      setPaymentLinkUrl(buildBookingPaymentLinkUrl(booking.paymentLink.token));
    }
  }, [booking]);

  useEffect(() => {
    function refresh() {
      const found = getBookingById(booking.id);
      if (found) {
        setCurrentBooking(found);
        if (found.paymentLink?.token) {
          setPaymentLinkUrl(buildBookingPaymentLinkUrl(found.paymentLink.token));
        }
      }
    }
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, refresh);
  }, [booking.id]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const invoices = resolveBookingInvoices(currentBooking);
  const summary = resolveBookingPaymentSummary(currentBooking);
  const showPaymentLink = shouldShowOrganizerPaymentLink(currentBooking);

  async function handleGenerateLink() {
    setGenerating(true);
    setLinkError(null);
    const result = generateOrganizerBookingPaymentLink({
      bookingId: currentBooking.id,
      actor: user,
    });
    setGenerating(false);

    if ("error" in result) {
      setLinkError(result.error);
      return;
    }

    setCurrentBooking(result.booking);
    setPaymentLinkUrl(result.paymentLinkUrl);
  }

  async function handleCopyLink() {
    if (!paymentLinkUrl) return;
    try {
      await navigator.clipboard.writeText(paymentLinkUrl);
      setCopied(true);
    } catch {
      setLinkError("Не удалось скопировать ссылку");
    }
  }

  return (
    <div className="rounded-2xl bg-cyan-50/80 px-4 py-4 ring-1 ring-cyan-100">
      <h4 className="text-sm font-semibold text-charcoal">Счета</h4>

      {showPaymentLink ? (
        <div className="mt-3 rounded-xl bg-white/80 px-3 py-3 ring-1 ring-cyan-100/80">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky/10 text-sky">
              <Link2 className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-charcoal">Ссылка на оплату</p>
              {currentBooking.paymentLink ? (
                <>
                  <p className="mt-1 text-xs text-slate">
                    {formatBookingPaymentLinkStatus(currentBooking.paymentLink)} ·{" "}
                    <FormattedPrice
                      priceUsd={currentBooking.paymentLink.amountUsd}
                      className="font-medium text-charcoal"
                    />
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={handleCopyLink}
                      disabled={!paymentLinkUrl}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? "Скопировано" : "Копировать"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={handleGenerateLink}
                      disabled={generating}
                    >
                      Обновить ссылку
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-1 text-xs leading-relaxed text-slate">
                    Создайте ссылку и отправьте туристу для оплаты предоплаты или полной суммы.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2 h-8"
                    onClick={handleGenerateLink}
                    disabled={generating}
                  >
                    Создать ссылку на оплату
                  </Button>
                </>
              )}
              {linkError ? <p className="mt-2 text-xs text-red-600">{linkError}</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-3 space-y-2">
        {invoices.map((invoice) => (
          <InvoiceRow key={invoice.id} invoice={invoice} />
        ))}
      </div>

      <div className="mt-4 flex items-start gap-1 border-t border-cyan-100/80 pt-4">
        <SummaryStat
          icon={<Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />}
          iconClassName="bg-emerald-50"
          label="Оплачено"
          valueUsd={summary.paidAmountUsd}
        />
        <SummaryStat
          icon={<Clock3 className="h-4 w-4 text-amber-600" />}
          iconClassName="bg-amber-50"
          label="Осталось оплатить"
          valueUsd={summary.remainingAmountUsd}
        />
        <SummaryStat
          icon={<Percent className="h-4 w-4 text-sky" strokeWidth={2.25} />}
          iconClassName="bg-sky/10"
          label="Сервисный сбор"
          valueUsd={summary.serviceFeeUsd}
        />
      </div>

      <p className="mt-4 rounded-xl bg-white px-3 py-3 text-xs leading-relaxed text-slate ring-1 ring-cyan-100/80">
        Предоплата осуществляется через Клуб Гидов, а остаток турист вносит вам. Можете принять
        остаток оплаты вне площадки удобным вам способом.
      </p>
    </div>
  );
}
