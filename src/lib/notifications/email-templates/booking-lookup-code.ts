import { renderEmailLayout, renderPlainEmail } from "./layout";
import type { EmailTemplateResult } from "./types";
import { escapeHtml } from "./utils";

export function renderBookingLookupCodeEmail(code: string): EmailTemplateResult {
  const safeCode = escapeHtml(code);
  const content = `
    <p style="margin:0 0 16px;">Введите этот код на сайте, чтобы открыть список своих заявок:</p>
    <p style="margin:0 0 16px;font-size:30px;font-weight:700;letter-spacing:6px;color:#0f172a;">${safeCode}</p>
    <p style="margin:0;">Код действует 10 минут и подходит только для поиска заявок. Никому его не сообщайте.</p>
  `;
  const options = { previewText: "Код для безопасного доступа к заявкам" };
  return {
    subject: "Код доступа к вашим заявкам",
    html: renderEmailLayout(content, options),
    text: renderPlainEmail(`Код доступа: ${code}\n\nКод действует 10 минут.`, options),
  };
}
