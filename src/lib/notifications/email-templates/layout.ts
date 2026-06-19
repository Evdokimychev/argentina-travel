import { getSiteUrl } from "@/lib/site-url";
import { escapeHtml } from "@/lib/notifications/email-templates/utils";
import type { EmailLayoutOptions } from "@/lib/notifications/email-templates/types";

const SITE_NAME = "Пора в Аргентину";

function buildPreviewText(previewText?: string): string {
  if (!previewText?.trim()) return "";
  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(previewText.trim())}
    </div>
  `;
}

function buildCtaBlock(cta: EmailLayoutOptions["cta"]): string {
  if (!cta) return "";
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
      <tr>
        <td style="border-radius:8px;background:#0f766e;">
          <a href="${escapeHtml(cta.href)}"
             style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
            ${escapeHtml(cta.label)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function buildFooter(unsubscribeUrl?: string | null): string {
  const settingsHint = "Настройки уведомлений можно изменить в личном кабинете.";
  const unsubscribeLine = unsubscribeUrl
    ? `<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#64748b;">
         <a href="${escapeHtml(unsubscribeUrl)}" style="color:#0f766e;text-decoration:underline;">
           Отписаться от писем этой категории
         </a>
       </p>`
    : "";

  return `
    <tr>
      <td style="padding:24px 32px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
        ${unsubscribeLine}
        <p style="margin:0;font-size:13px;line-height:1.5;color:#64748b;">${settingsHint}</p>
        <p style="margin:8px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">
          © ${new Date().getFullYear()} ${escapeHtml(SITE_NAME)} · ${escapeHtml(getSiteUrl())}
        </p>
      </td>
    </tr>
  `;
}

/** Unified responsive HTML shell for transactional messages. */
export function renderEmailLayout(contentHtml: string, options: EmailLayoutOptions = {}): string {
  const greetingBlock = options.greeting
    ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#0f172a;">${options.greeting}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(SITE_NAME)}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  ${buildPreviewText(options.previewText)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:28px 32px 12px;background:#0f766e;color:#ffffff;">
              <p style="margin:0;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;opacity:0.85;">${escapeHtml(SITE_NAME)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              ${greetingBlock}
              <div style="font-size:15px;line-height:1.65;color:#334155;">
                ${contentHtml}
              </div>
              ${buildCtaBlock(options.cta)}
            </td>
          </tr>
          ${buildFooter(options.unsubscribeUrl)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderPlainEmail(content: string, options: EmailLayoutOptions = {}): string {
  const lines: string[] = [SITE_NAME, ""];

  if (options.greeting) {
    lines.push(stripGreetingHtml(options.greeting), "");
  }

  lines.push(content.trim(), "");

  if (options.cta) {
    lines.push(`${options.cta.label}: ${options.cta.href}`, "");
  }

  if (options.unsubscribeUrl) {
    lines.push(`Отписаться: ${options.unsubscribeUrl}`, "");
  }

  lines.push("Настройки уведомлений — в личном кабинете.", getSiteUrl());
  return lines.join("\n");
}

function stripGreetingHtml(greeting: string): string {
  return greeting.replace(/<[^>]+>/g, "").trim();
}
