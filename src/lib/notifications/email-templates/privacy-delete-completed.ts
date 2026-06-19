import { absoluteUrl } from "@/lib/site-url";
import { renderEmailLayout, renderPlainEmail } from "@/lib/notifications/email-templates/layout";
import type { EmailLayoutOptions, EmailTemplateResult } from "@/lib/notifications/email-templates/types";
import { escapeHtml, formatRecipientName, formatRuDate } from "@/lib/notifications/email-templates/utils";

export type PrivacyDeleteCompletedTemplateInput = {
  recipientName?: string | null;
  completedAt?: string;
  requestId: string;
  supportEmail?: string | null;
};

export function renderPrivacyDeleteCompletedEmail(
  input: PrivacyDeleteCompletedTemplateInput
): EmailTemplateResult {
  const completedLabel = formatRuDate(input.completedAt);
  const supportEmail = input.supportEmail?.trim() || null;
  const privacyPageUrl = absoluteUrl("/profile/settings");

  const contentHtml = `
    <p style="margin:0 0 16px;">
      Мы завершили обработку вашего запроса на удаление персональных данных.
    </p>
    <p style="margin:0 0 12px;">
      Запрос: <strong>${escapeHtml(input.requestId)}</strong>
    </p>
    <p style="margin:0 0 12px;">
      Дата завершения: <strong>${escapeHtml(completedLabel)}</strong>
    </p>
    <p style="margin:0 0 12px;">
      Персональные данные профиля и контактные данные в связанных бронированиях обезличены.
      Финансовые и бухгалтерские записи сохранены в обезличенном виде в соответствии с требованиями закона.
    </p>
    ${
      supportEmail
        ? `<p style="margin:0;">Если у вас остались вопросы, напишите в поддержку: <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a>.</p>`
        : ""
    }
  `;

  const layoutOptions: EmailLayoutOptions = {
    previewText: "Ваш GDPR-запрос на удаление выполнен",
    greeting: `Здравствуйте, ${escapeHtml(formatRecipientName(input.recipientName))}!`,
    cta: { label: "Открыть настройки профиля", href: privacyPageUrl },
  };

  const plainBody = [
    "Мы завершили обработку вашего запроса на удаление персональных данных.",
    `Запрос: ${input.requestId}`,
    `Дата завершения: ${completedLabel}`,
    "Персональные данные профиля и контактные данные в связанных бронированиях обезличены.",
    "Финансовые и бухгалтерские записи сохранены в обезличенном виде по требованиям закона.",
    supportEmail ? `Поддержка: ${supportEmail}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: "Запрос на удаление данных выполнен",
    html: renderEmailLayout(contentHtml, layoutOptions),
    text: renderPlainEmail(plainBody, layoutOptions),
  };
}
