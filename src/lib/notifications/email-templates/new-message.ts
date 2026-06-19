import { formatBookingDisplayNumber } from "@/lib/booking-display";
import { renderEmailLayout, renderPlainEmail } from "@/lib/notifications/email-templates/layout";
import type { EmailLayoutOptions, EmailTemplateResult } from "@/lib/notifications/email-templates/types";
import { escapeHtml, formatRecipientName, shortText } from "@/lib/notifications/email-templates/utils";

export type NewMessageTemplateInput = {
  recipientName?: string | null;
  senderName: string;
  tourTitle: string;
  bookingId?: string | null;
  messageBody: string;
  messageHref: string;
  unsubscribeUrl?: string | null;
};

export function renderNewMessageEmail(input: NewMessageTemplateInput): EmailTemplateResult {
  const displayBookingId = input.bookingId
    ? formatBookingDisplayNumber(input.bookingId)
    : null;
  const senderName = input.senderName.trim() || "Собеседник";
  const preview = shortText(input.messageBody, 220);
  const contextLine = displayBookingId
    ? `По заявке №${escapeHtml(displayBookingId)} («${escapeHtml(input.tourTitle)}») пришло новое сообщение.`
    : `По обращению к эксперту «${escapeHtml(input.tourTitle)}» пришло новое сообщение.`;

  const contentHtml = `
    <p style="margin:0 0 12px;">
      ${contextLine}
    </p>
    <p style="margin:0 0 8px;">Отправитель: <strong>${escapeHtml(senderName)}</strong></p>
    <p style="margin:0;padding:12px 14px;border-radius:10px;background:#f1f5f9;color:#0f172a;">
      ${escapeHtml(preview)}
    </p>
  `;

  const layoutOptions: EmailLayoutOptions = {
    previewText: `Новое сообщение: ${senderName}`,
    greeting: `Здравствуйте, ${escapeHtml(formatRecipientName(input.recipientName))}!`,
    cta: { label: "Открыть переписку", href: input.messageHref },
    unsubscribeUrl: input.unsubscribeUrl,
  };

  const plainBody = [
    displayBookingId
      ? `По заявке №${displayBookingId} («${input.tourTitle}») пришло новое сообщение.`
      : `По обращению к эксперту «${input.tourTitle}» пришло новое сообщение.`,
    `Отправитель: ${senderName}`,
    "",
    preview,
  ].join("\n");

  return {
    subject: `Новое сообщение по заявке — ${input.tourTitle}`,
    html: renderEmailLayout(contentHtml, layoutOptions),
    text: renderPlainEmail(plainBody, layoutOptions),
  };
}
