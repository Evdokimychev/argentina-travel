"use client";

import { Check, Circle, Clock, CreditCard, Link2, XCircle } from "lucide-react";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import { resolveBookingPaymentStatus } from "@/lib/booking-params";
import { resolveTouristPaymentLinkHref } from "@/lib/booking-payment-display";
import { isBookingPaymentLinkExpired } from "@/lib/booking-payment-link";
import type { Booking } from "@/types/tourist";
import { cn } from "@/lib/cn";

type TimelineTone = "done" | "active" | "pending" | "error";

interface PaymentTimelineItem {
  id: string;
  title: string;
  description: string;
  timestamp?: string;
  tone: TimelineTone;
}

function formatTimelineDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return formatBookingCreatedAt(value);
}

function buildPaymentTimelineItems(booking: Booking): PaymentTimelineItem[] {
  const paymentStatus = resolveBookingPaymentStatus(booking);
  const link = booking.paymentLink;
  const payHref = resolveTouristPaymentLinkHref(booking);
  const items: PaymentTimelineItem[] = [];

  items.push({
    id: "created",
    title: "Заявка создана",
    description: "Бронирование зарегистрировано на платформе.",
    timestamp: formatTimelineDate(booking.createdAt),
    tone: "done",
  });

  const awaitingOrganizer = booking.status === "new" || booking.status === "pending";
  items.push({
    id: "organizer",
    title: awaitingOrganizer ? "Ожидание подтверждения" : "Заявка подтверждена",
    description: awaitingOrganizer
      ? "Организатор проверяет детали и подготовит условия оплаты."
      : "Организатор подтвердил заявку — можно переходить к оплате.",
    tone: awaitingOrganizer ? (link ? "done" : "active") : "done",
  });

  if (link || paymentStatus !== "pending" || payHref) {
    const expired = link ? isBookingPaymentLinkExpired(link) : false;
    const linkCancelled = link?.status === "cancelled";
    const linkPaid = link?.status === "paid" || paymentStatus === "paid" || paymentStatus === "partial";

    items.push({
      id: "link",
      title: linkPaid
        ? "Ссылка на оплату использована"
        : linkCancelled
          ? "Ссылка на оплату отменена"
          : expired
            ? "Срок ссылки истёк"
            : payHref
              ? "Ссылка на оплату активна"
              : "Ссылка на оплату",
      description: linkPaid
        ? "Платёжная ссылка закрыта после успешной или частичной оплаты."
        : linkCancelled
          ? "Организатор отменил ссылку — уточните способ оплаты напрямую."
          : expired
            ? "Запросите новую ссылку у организатора или напишите в поддержку."
            : payHref
              ? "Перейдите по ссылке Mercado Pago, чтобы внести предоплату или полную сумму."
              : "Ссылка появится после подтверждения заявки организатором.",
      timestamp: formatTimelineDate(link?.sentAt ?? link?.createdAt),
      tone: linkPaid ? "done" : linkCancelled || expired ? "error" : payHref ? "active" : "pending",
    });

    if (link?.openedAt) {
      items.push({
        id: "opened",
        title: "Страница оплаты открыта",
        description: "Вы перешли по ссылке — можно завершить платёж в Mercado Pago.",
        timestamp: formatTimelineDate(link.openedAt),
        tone: linkPaid ? "done" : "active",
      });
    }
  }

  if (paymentStatus === "paid") {
    items.push({
      id: "paid",
      title: "Оплата получена",
      description: "Сумма зафиксирована в системе. Квитанция доступна ниже.",
      timestamp: formatTimelineDate(link?.paidAt),
      tone: "done",
    });
  } else if (paymentStatus === "partial") {
    items.push({
      id: "partial",
      title: "Частичная оплата",
      description: "Внесена предоплата. Остаток можно оплатить по новой ссылке от организатора.",
      timestamp: formatTimelineDate(link?.paidAt),
      tone: "active",
    });
  } else if (paymentStatus === "refunded") {
    items.push({
      id: "refunded",
      title: "Возврат оформлен",
      description: "Средства возвращены или поставлены в очередь на возврат.",
      tone: "error",
    });
  } else if (link?.status === "active" && payHref) {
    items.push({
      id: "awaiting-payment",
      title: "Ожидаем оплату",
      description: "После платежа статус обновится автоматически по защищённому уведомлению.",
      tone: "pending",
    });
  }

  return items;
}

function TimelineIcon({ tone }: { tone: TimelineTone }) {
  if (tone === "done") return <Check className="h-3.5 w-3.5" strokeWidth={3} />;
  if (tone === "error") return <XCircle className="h-3.5 w-3.5" />;
  if (tone === "active") return <CreditCard className="h-3.5 w-3.5" />;
  return <Clock className="h-3.5 w-3.5" />;
}

export default function BookingPaymentStatusTimeline({ booking }: { booking: Booking }) {
  const items = buildPaymentTimelineItems(booking);

  if (items.length === 0) return null;

  return (
    <ol className="space-y-0">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const toneClass =
          item.tone === "done"
            ? "border-brand bg-brand text-white"
            : item.tone === "active"
              ? "border-sky bg-sky/10 text-sky"
              : item.tone === "error"
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-gray-200 bg-white text-slate";

        return (
          <li key={item.id} className="relative flex gap-4 pb-5 last:pb-0">
            {!isLast ? (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-20px)] w-px",
                  item.tone === "done" ? "bg-brand/40" : "bg-gray-200"
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative z-[1] mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                toneClass
              )}
              aria-hidden
            >
              <TimelineIcon tone={item.tone} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="font-medium text-charcoal">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate">{item.description}</p>
              {item.timestamp ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate">
                  <Link2 className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
                  {item.timestamp}
                </p>
              ) : item.tone === "pending" ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate">
                  <Circle className="h-2 w-2 fill-current" aria-hidden />
                  В процессе
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
