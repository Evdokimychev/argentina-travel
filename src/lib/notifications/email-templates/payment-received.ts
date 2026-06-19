import { absoluteUrl } from "@/lib/site-url";
import { formatBookingDisplayNumber } from "@/lib/booking-display";
import { renderEmailLayout, renderPlainEmail } from "@/lib/notifications/email-templates/layout";
import type { EmailLayoutOptions, EmailTemplateResult } from "@/lib/notifications/email-templates/types";
import { escapeHtml, formatRecipientName } from "@/lib/notifications/email-templates/utils";

export type PaymentReceivedTemplateInput = {
  recipientName?: string | null;
  bookingId: string;
  tourTitle: string;
  amountUsd?: number | null;
  paymentStatus: "paid" | "partial" | "refunded";
  providerLabel?: string | null;
  unsubscribeUrl?: string | null;
};

const STATUS_HEADLINES: Record<PaymentReceivedTemplateInput["paymentStatus"], string> = {
  paid: "Оплата получена",
  partial: "Зафиксирована частичная оплата",
  refunded: "Оформлен возврат",
};

export function renderPaymentReceivedEmail(
  input: PaymentReceivedTemplateInput
): EmailTemplateResult {
  const displayNumber = formatBookingDisplayNumber(input.bookingId);
  const headline = STATUS_HEADLINES[input.paymentStatus];
  const bookingHref = absoluteUrl(`/profile/bookings/${encodeURIComponent(input.bookingId)}`);
  const greeting = `Здравствуйте, ${escapeHtml(formatRecipientName(input.recipientName))}!`;

  const amountLine =
    typeof input.amountUsd === "number" && input.amountUsd > 0
      ? `<p style="margin:0 0 12px;">Сумма: <strong>${input.amountUsd.toLocaleString("ru-RU")} USD</strong></p>`
      : "";

  const providerLine = input.providerLabel?.trim()
    ? `<p style="margin:0 0 12px;">Способ оплаты: ${escapeHtml(input.providerLabel.trim())}</p>`
    : "";

  const contentHtml = `
    <p style="margin:0 0 16px;">${escapeHtml(headline)} по заявке №${escapeHtml(displayNumber)} на тур «${escapeHtml(input.tourTitle)}».</p>
    ${amountLine}
    ${providerLine}
    <p style="margin:0;">Детали платежа доступны в личном кабинете.</p>
  `;

  const layoutOptions: EmailLayoutOptions = {
    previewText: `${headline} — заявка №${displayNumber}`,
    greeting,
    cta: { label: "Открыть заявку", href: bookingHref },
    unsubscribeUrl: input.unsubscribeUrl,
  };

  const plainBody = [
    `${headline} по заявке №${displayNumber} на тур «${input.tourTitle}».`,
    typeof input.amountUsd === "number" && input.amountUsd > 0
      ? `Сумма: ${input.amountUsd.toLocaleString("ru-RU")} USD`
      : "",
    input.providerLabel?.trim() ? `Способ оплаты: ${input.providerLabel.trim()}` : "",
    "Детали платежа доступны в личном кабинете.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `${headline}: ${input.tourTitle}`,
    html: renderEmailLayout(contentHtml, layoutOptions),
    text: renderPlainEmail(plainBody, layoutOptions),
  };
}
