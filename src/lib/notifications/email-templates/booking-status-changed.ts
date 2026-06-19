import { BOOKING_STATUS_LABELS } from "@/data/booking-statuses";
import { absoluteUrl } from "@/lib/site-url";
import { formatBookingDisplayNumber } from "@/lib/booking-display";
import { renderEmailLayout, renderPlainEmail } from "@/lib/notifications/email-templates/layout";
import type { EmailLayoutOptions, EmailTemplateResult } from "@/lib/notifications/email-templates/types";
import { escapeHtml, formatRecipientName } from "@/lib/notifications/email-templates/utils";
import type { BookingStatus } from "@/types/tourist";

export type BookingStatusChangedTemplateInput = {
  recipientName?: string | null;
  bookingId: string;
  tourTitle: string;
  fromStatus: string | null;
  toStatus: string;
  /** When true, formats copy for admin/organizer alert instead of tourist. */
  adminCopy?: boolean;
  unsubscribeUrl?: string | null;
};

function statusLabel(status: string | null): string {
  if (!status) return "—";
  return BOOKING_STATUS_LABELS[status as BookingStatus] ?? status;
}

export function renderBookingStatusChangedEmail(
  input: BookingStatusChangedTemplateInput
): EmailTemplateResult {
  const displayNumber = formatBookingDisplayNumber(input.bookingId);
  const fromLabel = statusLabel(input.fromStatus);
  const toLabel = statusLabel(input.toStatus);
  const bookingHref = absoluteUrl(`/profile/bookings/${encodeURIComponent(input.bookingId)}`);
  const greeting = input.adminCopy
    ? undefined
    : `Здравствуйте, ${escapeHtml(formatRecipientName(input.recipientName))}!`;

  const contentHtml = input.adminCopy
    ? `
      <p style="margin:0 0 12px;">Заявка №${escapeHtml(displayNumber)} — ${escapeHtml(input.tourTitle)}</p>
      <p style="margin:0;">Статус: ${escapeHtml(fromLabel)} → <strong>${escapeHtml(toLabel)}</strong></p>
    `
    : `
      <p style="margin:0 0 16px;">Статус заявки №${escapeHtml(displayNumber)} по туру «${escapeHtml(input.tourTitle)}» обновлён.</p>
      <p style="margin:0 0 12px;">Было: ${escapeHtml(fromLabel)}</p>
      <p style="margin:0;">Сейчас: <strong>${escapeHtml(toLabel)}</strong></p>
    `;

  const layoutOptions: EmailLayoutOptions = {
    previewText: `Статус заявки №${displayNumber}: ${toLabel}`,
    greeting,
    cta: input.adminCopy ? undefined : { label: "Посмотреть заявку", href: bookingHref },
    unsubscribeUrl: input.unsubscribeUrl,
  };

  const plainBody = input.adminCopy
    ? [
        `Заявка №${displayNumber} — ${input.tourTitle}`,
        `Статус: ${fromLabel} → ${toLabel}`,
      ].join("\n")
    : [
        `Статус заявки №${displayNumber} по туру «${input.tourTitle}» обновлён.`,
        `Было: ${fromLabel}`,
        `Сейчас: ${toLabel}`,
      ].join("\n");

  return {
    subject: input.adminCopy
      ? `Статус заявки изменён: ${input.tourTitle}`
      : `Статус заявки: ${toLabel} — ${input.tourTitle}`,
    html: renderEmailLayout(contentHtml, layoutOptions),
    text: renderPlainEmail(plainBody, layoutOptions),
  };
}
