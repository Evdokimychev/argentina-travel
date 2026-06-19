import { renderEmailLayout, renderPlainEmail } from "@/lib/notifications/email-templates/layout";
import type { EmailLayoutOptions, EmailTemplateResult } from "@/lib/notifications/email-templates/types";
import { escapeHtml, formatRecipientName, formatRuDate } from "@/lib/notifications/email-templates/utils";

export type ContentFreshnessReportItem = {
  title: string;
  href: string;
  docType: string;
  ageDays: number;
  lastVerifiedAt: string;
  nextReviewAt: string;
  status: "stale" | "critical";
};

export type ContentFreshnessReportTemplateInput = {
  recipientName?: string | null;
  items: ContentFreshnessReportItem[];
  generatedAt?: string;
  dashboardUrl?: string;
};

function typeLabel(docType: string): string {
  switch (docType) {
    case "guide":
      return "Путеводитель/иммиграция";
    case "blog":
      return "Блог";
    case "legal":
      return "Юридический документ";
    case "destination":
      return "Направление";
    case "place":
      return "Место";
    default:
      return docType;
  }
}

export function renderContentFreshnessReportEmail(
  input: ContentFreshnessReportTemplateInput
): EmailTemplateResult {
  const reportDate = formatRuDate(input.generatedAt ?? new Date());
  const greeting = `Здравствуйте, ${escapeHtml(formatRecipientName(input.recipientName ?? "редакция"))}!`;
  const criticalCount = input.items.filter((item) => item.status === "critical").length;
  const staleCount = input.items.length - criticalCount;

  const rowsHtml = input.items
    .slice(0, 40)
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
          <a href="${escapeHtml(item.href)}" style="color:#0f766e;text-decoration:none;font-weight:600;">
            ${escapeHtml(item.title)}
          </a>
          <div style="margin-top:4px;font-size:12px;color:#64748b;">
            ${escapeHtml(typeLabel(item.docType))} · ${item.ageDays} дн. без проверки
          </div>
          <div style="margin-top:4px;font-size:12px;color:#64748b;">
            Последняя проверка: ${escapeHtml(formatRuDate(item.lastVerifiedAt))} · Срок ревью: ${escapeHtml(
              formatRuDate(item.nextReviewAt)
            )}
          </div>
        </td>
      </tr>`
    )
    .join("");

  const contentHtml = `
    <p style="margin:0 0 10px;">Отчёт по актуальности контента за ${escapeHtml(reportDate)}.</p>
    <p style="margin:0 0 14px;">
      Требуют проверки: <strong>${input.items.length}</strong> материалов
      (критично: <strong>${criticalCount}</strong>, просрочено: <strong>${staleCount}</strong>).
    </p>
    ${
      input.items.length > 0
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
             ${rowsHtml}
           </table>`
        : `<p style="margin:0;">Просроченных материалов нет.</p>`
    }
    <p style="margin:16px 0 0;font-size:13px;color:#64748b;">Это автоматический отчёт cron E86.</p>
  `;

  const layoutOptions: EmailLayoutOptions = {
    previewText: `Просроченные материалы: ${input.items.length}`,
    greeting,
    cta: input.dashboardUrl
      ? {
          label: "Открыть панель актуальности",
          href: input.dashboardUrl,
        }
      : undefined,
  };

  const plainList =
    input.items.length > 0
      ? input.items
          .slice(0, 40)
          .map(
            (item) =>
              `• ${item.title} (${typeLabel(item.docType)}) — ${item.ageDays} дн.; проверка: ${formatRuDate(item.lastVerifiedAt)}; срок ревью: ${formatRuDate(item.nextReviewAt)}`
          )
          .join("\n")
      : "Просроченных материалов нет.";

  const plainBody = [
    `Отчёт по актуальности контента за ${reportDate}.`,
    `Требуют проверки: ${input.items.length} (критично: ${criticalCount}, просрочено: ${staleCount}).`,
    "",
    plainList,
    "",
    "Это автоматический отчёт cron E86.",
  ].join("\n");

  return {
    subject: `Контент: ${input.items.length} материалов требуют проверки`,
    html: renderEmailLayout(contentHtml, layoutOptions),
    text: renderPlainEmail(plainBody, layoutOptions),
  };
}
