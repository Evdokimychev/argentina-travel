import { absoluteUrl } from "@/lib/site-url";
import { renderEmailLayout, renderPlainEmail } from "@/lib/notifications/email-templates/layout";
import type { EmailLayoutOptions, EmailTemplateResult } from "@/lib/notifications/email-templates/types";
import { escapeHtml, formatRecipientName } from "@/lib/notifications/email-templates/utils";

export type ReviewApprovedTemplateInput = {
  recipientName?: string | null;
  tourTitle: string;
  tourSlug: string;
  action: "approve" | "reject";
  note?: string | null;
  unsubscribeUrl?: string | null;
};

export function renderReviewApprovedEmail(input: ReviewApprovedTemplateInput): EmailTemplateResult {
  const approved = input.action === "approve";
  const tourHref = absoluteUrl(`/tours/${encodeURIComponent(input.tourSlug)}`);
  const greeting = `Здравствуйте, ${escapeHtml(formatRecipientName(input.recipientName))}!`;

  const noteBlock = input.note?.trim()
    ? `<p style="margin:16px 0 0;padding:12px 16px;background:#f8fafc;border-left:3px solid #94a3b8;">
         <strong>Комментарий модератора:</strong> ${escapeHtml(input.note.trim())}
       </p>`
    : "";

  const contentHtml = approved
    ? `
      <p style="margin:0 0 16px;">Ваш отзыв по туру «${escapeHtml(input.tourTitle)}» прошёл модерацию и опубликован на сайте.</p>
      <p style="margin:0;">Спасибо, что делитесь впечатлениями — это помогает другим путешественникам выбрать маршрут.</p>
    `
    : `
      <p style="margin:0 0 16px;">Отзыв по туру «${escapeHtml(input.tourTitle)}» пока не опубликован.</p>
      <p style="margin:0;">Вы можете отредактировать текст и отправить его на повторную проверку.</p>
      ${noteBlock}
    `;

  const layoutOptions: EmailLayoutOptions = {
    previewText: approved
      ? `Отзыв по «${input.tourTitle}» опубликован`
      : `Отзыв по «${input.tourTitle}» не прошёл модерацию`,
    greeting,
    cta: approved ? { label: "Посмотреть тур", href: tourHref } : undefined,
    unsubscribeUrl: input.unsubscribeUrl,
  };

  const plainBody = approved
    ? [
        `Ваш отзыв по туру «${input.tourTitle}» прошёл модерацию и опубликован.`,
        "Спасибо, что делитесь впечатлениями — это помогает другим путешественникам.",
      ].join("\n")
    : [
        `Отзыв по туру «${input.tourTitle}» пока не опубликован.`,
        "Вы можете отредактировать текст и отправить его на повторную проверку.",
        input.note?.trim() ? `Комментарий модератора: ${input.note.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");

  return {
    subject: approved
      ? `Ваш отзыв опубликован: ${input.tourTitle}`
      : `Отзыв по туру «${input.tourTitle}» отклонён`,
    html: renderEmailLayout(contentHtml, layoutOptions),
    text: renderPlainEmail(plainBody, layoutOptions),
  };
}
