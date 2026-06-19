import { absoluteUrl } from "@/lib/site-url";
import { formatBookingDisplayNumber } from "@/lib/booking-display";
import { renderEmailLayout, renderPlainEmail } from "@/lib/notifications/email-templates/layout";
import type { EmailLayoutOptions, EmailTemplateResult } from "@/lib/notifications/email-templates/types";
import { escapeHtml, formatRecipientName } from "@/lib/notifications/email-templates/utils";

export type BookingConfirmedTemplateInput = {
  recipientName?: string | null;
  bookingId: string;
  tourTitle: string;
  guests?: number;
  startDate?: string | null;
  endDate?: string | null;
  unsubscribeUrl?: string | null;
};

export function renderBookingConfirmedEmail(
  input: BookingConfirmedTemplateInput
): EmailTemplateResult {
  const displayNumber = formatBookingDisplayNumber(input.bookingId);
  const bookingHref = absoluteUrl(`/profile/bookings/${encodeURIComponent(input.bookingId)}`);
  const greeting = `Здравствуйте, ${escapeHtml(formatRecipientName(input.recipientName))}!`;

  const dateLine =
    input.startDate?.trim()
      ? `<p style="margin:0 0 12px;">Даты: <strong>${escapeHtml(input.startDate.trim())}${input.endDate?.trim() ? ` — ${escapeHtml(input.endDate.trim())}` : ""}</strong></p>`
      : "";

  const guestsLine =
    typeof input.guests === "number" && input.guests > 0
      ? `<p style="margin:0 0 12px;">Участников: <strong>${input.guests}</strong></p>`
      : "";

  const contentHtml = `
    <p style="margin:0 0 16px;">Заявка №${escapeHtml(displayNumber)} на тур «${escapeHtml(input.tourTitle)}» принята и передана организатору.</p>
    ${dateLine}
    ${guestsLine}
    <p style="margin:0;">Мы сообщим, когда статус изменится. Подробности — в личном кабинете.</p>
  `;

  const layoutOptions: EmailLayoutOptions = {
    previewText: `Заявка №${displayNumber} на «${input.tourTitle}» принята`,
    greeting,
    cta: { label: "Открыть заявку", href: bookingHref },
    unsubscribeUrl: input.unsubscribeUrl,
  };

  const plainBody = [
    `Заявка №${displayNumber} на тур «${input.tourTitle}» принята и передана организатору.`,
    input.startDate?.trim()
      ? `Даты: ${input.startDate.trim()}${input.endDate?.trim() ? ` — ${input.endDate.trim()}` : ""}`
      : "",
    typeof input.guests === "number" && input.guests > 0 ? `Участников: ${input.guests}` : "",
    "Мы сообщим, когда статус изменится. Подробности — в личном кабинете.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Заявка принята: ${input.tourTitle}`,
    html: renderEmailLayout(contentHtml, layoutOptions),
    text: renderPlainEmail(plainBody, layoutOptions),
  };
}
