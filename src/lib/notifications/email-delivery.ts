import { absoluteUrl } from "@/lib/site-url";

type ReviewModerationAction = "approve" | "reject";

type EmailConfig = {
  apiKey: string;
  from: string;
  adminEmail: string | null;
};

type SendEmailInput = {
  to: string[];
  subject: string;
  html: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function resolveEmailConfig(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    apiKey,
    from: process.env.LEADS_NOTIFY_FROM?.trim() ?? "onboarding@resend.dev",
    adminEmail: process.env.LEADS_NOTIFY_EMAIL?.trim() ?? null,
  };
}

function normalizeRecipients(values: Array<string | null | undefined>): string[] {
  const unique = new Set<string>();
  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized) continue;
    unique.add(normalized.toLowerCase());
  }
  return [...unique];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatName(name?: string | null): string {
  const normalized = name?.trim();
  if (!normalized) return "путешественник";
  return normalized;
}

function shortReviewText(text: string): string {
  const normalized = text.trim();
  if (normalized.length <= 420) return normalized;
  return `${normalized.slice(0, 420).trimEnd()}...`;
}

async function sendEmail(config: EmailConfig, input: SendEmailInput): Promise<void> {
  if (!input.to.length) return;

  try {
    await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Non-blocking delivery channel.
  }
}

export async function sendReviewModerationEmail(input: {
  touristEmail: string | null;
  touristName?: string | null;
  tourTitle: string;
  action: ReviewModerationAction;
  note?: string | null;
}): Promise<void> {
  const config = resolveEmailConfig();
  if (!config) return;

  const recipients = normalizeRecipients([input.touristEmail, config.adminEmail]);
  if (!recipients.length) return;

  const approved = input.action === "approve";
  const subject = approved
    ? `Ваш отзыв опубликован: ${input.tourTitle}`
    : `Отзыв по туру «${input.tourTitle}» отклонён`;
  const noteLine = input.note?.trim()
    ? `<p><strong>Комментарий модератора:</strong> ${escapeHtml(input.note.trim())}</p>`
    : "";
  const greeting = `Здравствуйте, ${escapeHtml(formatName(input.touristName))}!`;

  const html = approved
    ? `
      <p>${greeting}</p>
      <p>Ваш отзыв по туру «${escapeHtml(input.tourTitle)}» успешно прошёл модерацию и опубликован.</p>
      <p>Спасибо, что делитесь опытом — это помогает другим путешественникам.</p>
    `
    : `
      <p>${greeting}</p>
      <p>Отзыв по туру «${escapeHtml(input.tourTitle)}» пока не опубликован.</p>
      <p>Вы можете отредактировать текст и отправить отзыв на повторную модерацию.</p>
      ${noteLine}
    `;

  await sendEmail(config, {
    to: recipients,
    subject,
    html,
  });
}

export async function sendOrganizerNewReviewEmail(input: {
  organizerEmail: string | null;
  organizerName?: string | null;
  tourTitle: string;
  tourSlug: string;
  touristName?: string | null;
  rating: number;
  reviewText: string;
  tripDate?: string | null;
}): Promise<void> {
  const config = resolveEmailConfig();
  if (!config) return;

  const recipients = normalizeRecipients([input.organizerEmail, config.adminEmail]);
  if (!recipients.length) return;

  const subject = `Новый опубликованный отзыв: ${input.tourTitle}`;
  const greeting = `Здравствуйте, ${escapeHtml(formatName(input.organizerName))}!`;
  const authorLine = input.touristName?.trim()
    ? `Автор: ${escapeHtml(input.touristName.trim())}`
    : "Автор: турист платформы";
  const tripDateLine = input.tripDate?.trim()
    ? `<p>Дата поездки: ${escapeHtml(input.tripDate.trim())}</p>`
    : "";
  const safeReviewText = shortReviewText(input.reviewText);
  const organizerReviewsUrl = `${absoluteUrl("/organizer/reviews")}?tour=${encodeURIComponent(input.tourSlug)}`;

  const html = `
    <p>${greeting}</p>
    <p>По туру «${escapeHtml(input.tourTitle)}» опубликован новый отзыв.</p>
    <p>${authorLine}</p>
    <p>Оценка: ${input.rating}/5</p>
    <p>Текст отзыва: ${escapeHtml(safeReviewText)}</p>
    ${tripDateLine}
    <p>Ссылка для работы с отзывами: <a href="${organizerReviewsUrl}">кабинет организатора</a>.</p>
  `;

  await sendEmail(config, {
    to: recipients,
    subject,
    html,
  });
}

export async function sendAdminUnreadDigestHook(input: {
  unreadCount: number;
}): Promise<void> {
  if (input.unreadCount <= 0) return;
  // Stub for scheduled digest delivery based on unread admin_notifications count.
}
