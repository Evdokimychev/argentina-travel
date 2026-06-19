import { renderEmailLayout, renderPlainEmail } from "@/lib/notifications/email-templates/layout";
import type { EmailLayoutOptions, EmailTemplateResult } from "@/lib/notifications/email-templates/types";
import { escapeHtml, formatRecipientName, formatRuDate } from "@/lib/notifications/email-templates/utils";

export type TripPrepReminderTemplateInput = {
  recipientName?: string | null;
  bookingId: string;
  tourTitle: string;
  startDate: string;
  daysBefore: 7 | 3 | 1;
  prepHref: string;
  unsubscribeUrl?: string | null;
};

function daysLabel(daysBefore: 7 | 3 | 1): string {
  if (daysBefore === 1) return "завтра";
  if (daysBefore === 3) return "через 3 дня";
  return "через неделю";
}

export function renderTripPrepReminderEmail(
  input: TripPrepReminderTemplateInput
): EmailTemplateResult {
  const startDateLabel = formatRuDate(input.startDate);
  const whenLabel = daysLabel(input.daysBefore);

  const contentHtml = `
    <p style="margin:0 0 12px;">
      До начала тура «${escapeHtml(input.tourTitle)}» осталось ${whenLabel} (${escapeHtml(startDateLabel)}).
    </p>
    <p style="margin:0;">
      Откройте чек-лист подготовки: документы, связь, деньги, багаж и контакты организатора.
    </p>
  `;

  const layoutOptions: EmailLayoutOptions = {
    previewText: `Подготовка к поездке — ${input.tourTitle}`,
    greeting: `Здравствуйте, ${escapeHtml(formatRecipientName(input.recipientName))}!`,
    cta: { label: "Открыть чек-лист", href: input.prepHref },
    unsubscribeUrl: input.unsubscribeUrl,
  };

  const plainBody = [
    `До начала тура «${input.tourTitle}» осталось ${whenLabel} (${startDateLabel}).`,
    "Откройте чек-лист подготовки в личном кабинете.",
  ].join("\n");

  return {
    subject: `Подготовка к поездке — ${input.tourTitle}`,
    html: renderEmailLayout(contentHtml, layoutOptions),
    text: renderPlainEmail(plainBody, layoutOptions),
  };
}
