import { renderEmailLayout, renderPlainEmail } from "@/lib/notifications/email-templates/layout";
import type { EmailLayoutOptions, EmailTemplateResult } from "@/lib/notifications/email-templates/types";
import { escapeHtml, formatRecipientName, formatRuDate } from "@/lib/notifications/email-templates/utils";

export type DigestEventItem = {
  title: string;
  body: string;
  created_at?: string;
  category?: string;
};

export type DigestDailyTemplateInput = {
  recipientName?: string | null;
  events: DigestEventItem[];
  scopeLabel: string;
  dateLabel?: string;
  unsubscribeUrl?: string | null;
};

export function renderDigestDailyEmail(input: DigestDailyTemplateInput): EmailTemplateResult {
  const dateLabel = input.dateLabel ?? formatRuDate();
  const greeting = `Здравствуйте, ${escapeHtml(formatRecipientName(input.recipientName))}!`;

  const itemsHtml =
    input.events.length > 0
      ? `<ul style="margin:16px 0 0;padding-left:20px;">${input.events
          .slice(0, 20)
          .map(
            (event) =>
              `<li style="margin:0 0 10px;"><strong>${escapeHtml(event.title)}</strong> — ${escapeHtml(event.body)}</li>`
          )
          .join("")}</ul>`
      : `<p style="margin:16px 0 0;">За последние сутки новых событий не было.</p>`;

  const contentHtml = `
    <p style="margin:0 0 8px;">Ежедневная сводка уведомлений (${escapeHtml(input.scopeLabel)}) за ${escapeHtml(dateLabel)}.</p>
    ${itemsHtml}
    <p style="margin:20px 0 0;font-size:14px;color:#64748b;">Это автоматическая рассылка.</p>
  `;

  const layoutOptions: EmailLayoutOptions = {
    previewText: `Сводка уведомлений за ${dateLabel}`,
    greeting,
    unsubscribeUrl: input.unsubscribeUrl,
  };

  const plainItems =
    input.events.length > 0
      ? input.events
          .slice(0, 20)
          .map((event) => `• ${event.title} — ${event.body}`)
          .join("\n")
      : "За последние сутки новых событий не было.";

  const plainBody = [
    `Ежедневная сводка (${input.scopeLabel}) за ${dateLabel}.`,
    "",
    plainItems,
    "",
    "Это автоматическая рассылка.",
  ].join("\n");

  return {
    subject: `Сводка уведомлений — ${dateLabel}`,
    html: renderEmailLayout(contentHtml, layoutOptions),
    text: renderPlainEmail(plainBody, layoutOptions),
  };
}
