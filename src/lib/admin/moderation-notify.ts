/**
 * Optional email alerts for moderation outcomes (Resend).
 */
import { absoluteUrl } from "@/lib/site-url";

export async function notifyModerationOutcome(input: {
  entityType: string;
  entityTitle: string;
  ownerEmail: string | null;
  action: "approve" | "reject";
  note?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const adminTo = process.env.LEADS_NOTIFY_EMAIL?.trim();
  const from = process.env.LEADS_NOTIFY_FROM?.trim() ?? "onboarding@resend.dev";

  if (!apiKey) return;

  const actionLabel = input.action === "approve" ? "одобрено" : "отклонено";
  const subject = `Модерация: ${input.entityTitle} — ${actionLabel}`;
  const html = `
    <p>Тип: ${input.entityType}</p>
    <p>Объект: <strong>${input.entityTitle}</strong></p>
    <p>Решение: ${actionLabel}</p>
    ${input.note ? `<p>Комментарий: ${input.note}</p>` : ""}
  `;

  const recipients = [adminTo, input.ownerEmail].filter(Boolean) as string[];
  if (!recipients.length) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: recipients, subject, html }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Non-blocking
  }
}

export async function notifyOrganizerApplicationReview(input: {
  applicantEmail: string;
  applicantName: string;
  action: "approve" | "reject";
  note?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.LEADS_NOTIFY_FROM?.trim() ?? "onboarding@resend.dev";

  if (!apiKey || !input.applicantEmail) return;

  const subject =
    input.action === "approve"
      ? "Добро пожаловать в кабинет организатора — Пора в Аргентину"
      : "Заявка организатора — требуются уточнения";

  const organizerCabinetUrl = absoluteUrl("/organizer/tours?welcome=1");

  const html =
    input.action === "approve"
      ? `<p>Здравствуйте, ${input.applicantName}!</p>
<p>Ваша заявка организатора одобрена.</p>
<p>Вы уже можете зайти в кабинет и начать публикацию.</p>
<p><strong>Чек-лист первого шага:</strong></p>
<ul>
  <li>Создайте первый тур</li>
</ul>
<p><a href="${organizerCabinetUrl}">Открыть кабинет организатора</a></p>`
      : `<p>Здравствуйте, ${input.applicantName}!</p><p>К сожалению, заявку пока нельзя одобрить.${input.note ? ` Причина: ${input.note}` : ""}</p>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.applicantEmail],
        subject,
        html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Non-blocking
  }
}
