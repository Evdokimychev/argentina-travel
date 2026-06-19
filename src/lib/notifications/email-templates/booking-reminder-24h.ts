import { formatBookingDisplayNumber } from "@/lib/booking-display";
import { renderEmailLayout, renderPlainEmail } from "@/lib/notifications/email-templates/layout";
import type { EmailLayoutOptions, EmailTemplateResult } from "@/lib/notifications/email-templates/types";
import { escapeHtml, formatRecipientName, formatRuDate } from "@/lib/notifications/email-templates/utils";

export type BookingReminder24hTemplateInput = {
  recipientName?: string | null;
  bookingId: string;
  tourTitle: string;
  startDate: string;
  detailsHref: string;
  unsubscribeUrl?: string | null;
};

export function renderBookingReminder24hEmail(
  input: BookingReminder24hTemplateInput
): EmailTemplateResult {
  const displayBookingId = formatBookingDisplayNumber(input.bookingId);
  const startDateLabel = formatRuDate(input.startDate);

  const contentHtml = `
    <p style="margin:0 0 12px;">
      Напоминаем: тур «${escapeHtml(input.tourTitle)}» начнётся примерно через 24 часа.
    </p>
    <p style="margin:0 0 12px;">Заявка №${escapeHtml(displayBookingId)}</p>
    <p style="margin:0;">Дата начала: <strong>${escapeHtml(startDateLabel)}</strong></p>
  `;

  const layoutOptions: EmailLayoutOptions = {
    previewText: `Напоминание о туре «${input.tourTitle}»`,
    greeting: `Здравствуйте, ${escapeHtml(formatRecipientName(input.recipientName))}!`,
    cta: { label: "Открыть детали заявки", href: input.detailsHref },
    unsubscribeUrl: input.unsubscribeUrl,
  };

  const plainBody = [
    `Напоминаем: тур «${input.tourTitle}» начнётся примерно через 24 часа.`,
    `Заявка №${displayBookingId}`,
    `Дата начала: ${startDateLabel}`,
  ].join("\n");

  return {
    subject: `Напоминание о поездке — ${input.tourTitle}`,
    html: renderEmailLayout(contentHtml, layoutOptions),
    text: renderPlainEmail(plainBody, layoutOptions),
  };
}
