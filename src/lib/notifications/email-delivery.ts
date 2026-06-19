import {
  escapeHtml,
  renderBookingConfirmedEmail,
  renderBookingStatusChangedEmail,
  renderContentFreshnessReportEmail,
  renderDigestDailyEmail,
  renderEmailLayout,
  renderPaymentReceivedEmail,
  renderPlainEmail,
  renderReviewApprovedEmail,
  shortText,
  type ContentFreshnessReportItem,
  type DigestEventItem,
  type EmailTemplateResult,
} from "@/lib/notifications/email-templates";
import {
  isEmailNotificationEnabled,
  isPersistableUserId,
} from "@/lib/notifications/notifications-server";
import {
  buildListUnsubscribeHeader,
  buildUnsubscribeUrl,
} from "@/lib/notifications/unsubscribe-token";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { absoluteUrl } from "@/lib/site-url";
import type { NotificationCategory } from "@/types/notifications-hub";

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
  text: string;
  headers?: Record<string, string>;
};

type TransactionalSendContext = {
  userId?: string | null;
  category: NotificationCategory;
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

async function shouldSendEmail(context: TransactionalSendContext): Promise<boolean> {
  if (!isPersistableUserId(context.userId)) return true;

  try {
    const supabase = createSupabaseAdminClient();
    return isEmailNotificationEnabled(supabase, context.userId, context.category);
  } catch {
    return true;
  }
}

function resolveUnsubscribeUrl(context: TransactionalSendContext): string | null {
  if (!isPersistableUserId(context.userId)) return null;
  return buildUnsubscribeUrl(context.userId, context.category);
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
        text: input.text,
        headers: input.headers,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Non-blocking delivery channel.
  }
}

async function sendTemplateEmail(
  template: EmailTemplateResult,
  recipients: string[],
  context: TransactionalSendContext
): Promise<boolean> {
  const config = resolveEmailConfig();
  if (!config || !recipients.length) return false;

  const allowed = await shouldSendEmail(context);
  if (!allowed) return false;

  const unsubscribeUrl = resolveUnsubscribeUrl(context);

  await sendEmail(config, {
    to: recipients,
    subject: template.subject,
    html: template.html,
    text: template.text,
    headers: buildListUnsubscribeHeader(unsubscribeUrl),
  });

  return true;
}

export async function sendBookingConfirmedEmail(input: {
  userId?: string | null;
  recipientEmail: string | null;
  recipientName?: string | null;
  bookingId: string;
  tourTitle: string;
  guests?: number;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<boolean> {
  const recipients = normalizeRecipients([input.recipientEmail]);
  if (!recipients.length) return false;

  const template = renderBookingConfirmedEmail({
    recipientName: input.recipientName,
    bookingId: input.bookingId,
    tourTitle: input.tourTitle,
    guests: input.guests,
    startDate: input.startDate,
    endDate: input.endDate,
    unsubscribeUrl: resolveUnsubscribeUrl({ userId: input.userId, category: "booking" }),
  });

  return sendTemplateEmail(template, recipients, {
    userId: input.userId,
    category: "booking",
  });
}

export async function sendBookingStatusChangedEmail(input: {
  userId?: string | null;
  recipientEmail: string | null;
  recipientName?: string | null;
  bookingId: string;
  tourTitle: string;
  fromStatus: string | null;
  toStatus: string;
  adminCopy?: boolean;
}): Promise<boolean> {
  const config = resolveEmailConfig();
  if (!config) return false;

  const primaryRecipients = normalizeRecipients([
    input.adminCopy ? config.adminEmail : input.recipientEmail,
  ]);
  if (!primaryRecipients.length) return false;

  const template = renderBookingStatusChangedEmail({
    recipientName: input.recipientName,
    bookingId: input.bookingId,
    tourTitle: input.tourTitle,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    adminCopy: input.adminCopy,
    unsubscribeUrl: input.adminCopy
      ? null
      : resolveUnsubscribeUrl({ userId: input.userId, category: "booking" }),
  });

  return sendTemplateEmail(template, primaryRecipients, {
    userId: input.adminCopy ? null : input.userId,
    category: "booking",
  });
}

export async function sendPaymentReceivedEmail(input: {
  userId?: string | null;
  recipientEmail: string | null;
  recipientName?: string | null;
  bookingId: string;
  tourTitle: string;
  amountUsd?: number | null;
  paymentStatus: "paid" | "partial" | "refunded";
  providerLabel?: string | null;
}): Promise<boolean> {
  const config = resolveEmailConfig();
  if (!config) return false;

  const recipients = normalizeRecipients([input.recipientEmail, config.adminEmail]);
  if (!recipients.length) return false;

  const template = renderPaymentReceivedEmail({
    recipientName: input.recipientName,
    bookingId: input.bookingId,
    tourTitle: input.tourTitle,
    amountUsd: input.amountUsd,
    paymentStatus: input.paymentStatus,
    providerLabel: input.providerLabel,
    unsubscribeUrl: resolveUnsubscribeUrl({ userId: input.userId, category: "payment" }),
  });

  return sendTemplateEmail(template, recipients, {
    userId: input.userId,
    category: "payment",
  });
}

export async function sendReviewModerationEmail(input: {
  userId?: string | null;
  touristEmail: string | null;
  touristName?: string | null;
  tourTitle: string;
  tourSlug?: string;
  action: ReviewModerationAction;
  note?: string | null;
}): Promise<void> {
  const config = resolveEmailConfig();
  if (!config) return;

  const recipients = normalizeRecipients([input.touristEmail, config.adminEmail]);
  if (!recipients.length) return;

  const template = renderReviewApprovedEmail({
    recipientName: input.touristName,
    tourTitle: input.tourTitle,
    tourSlug: input.tourSlug ?? "",
    action: input.action,
    note: input.note,
    unsubscribeUrl: resolveUnsubscribeUrl({ userId: input.userId, category: "reviews" }),
  });

  await sendTemplateEmail(template, recipients, {
    userId: input.userId,
    category: "reviews",
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

  const organizerReviewsUrl = `${absoluteUrl("/organizer/reviews")}?tour=${encodeURIComponent(input.tourSlug)}`;
  const authorLine = input.touristName?.trim()
    ? `Автор: ${escapeHtml(input.touristName.trim())}`
    : "Автор: турист платформы";
  const safeReviewText = escapeHtml(shortText(input.reviewText));
  const organizerName = escapeHtml(input.organizerName?.trim() || "организатор");

  const contentHtml = `
    <p style="margin:0 0 12px;">По туру «${escapeHtml(input.tourTitle)}» опубликован новый отзыв.</p>
    <p style="margin:0 0 12px;">${authorLine}</p>
    <p style="margin:0 0 12px;">Оценка: ${input.rating}/5</p>
    <p style="margin:0 0 12px;">Текст отзыва: ${safeReviewText}</p>
    ${input.tripDate?.trim() ? `<p style="margin:0 0 12px;">Дата поездки: ${escapeHtml(input.tripDate.trim())}</p>` : ""}
  `;

  const layoutOptions = {
    greeting: `Здравствуйте, ${organizerName}!`,
    cta: { label: "Открыть отзывы", href: organizerReviewsUrl },
  };

  await sendEmail(config, {
    to: recipients,
    subject: `Новый опубликованный отзыв: ${input.tourTitle}`,
    html: renderEmailLayout(contentHtml, layoutOptions),
    text: renderPlainEmail(
      [
        `По туру «${input.tourTitle}» опубликован новый отзыв.`,
        input.touristName?.trim() ? `Автор: ${input.touristName.trim()}` : "Автор: турист платформы",
        `Оценка: ${input.rating}/5`,
        `Текст отзыва: ${shortText(input.reviewText)}`,
        input.tripDate?.trim() ? `Дата поездки: ${input.tripDate.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      layoutOptions
    ),
  });
}

export async function sendAdminUnreadDigestHook(input: {
  unreadCount: number;
}): Promise<void> {
  if (input.unreadCount <= 0) return;
  // Stub for scheduled digest delivery based on unread admin_notifications count.
}

export async function sendContentFreshnessReportEmail(input: {
  recipientEmails: string[];
  recipientName?: string | null;
  items: ContentFreshnessReportItem[];
  generatedAt?: string;
  dashboardUrl?: string;
}): Promise<boolean> {
  if (input.items.length === 0) return false;
  const recipients = normalizeRecipients(input.recipientEmails);
  if (!recipients.length) return false;

  const template = renderContentFreshnessReportEmail({
    recipientName: input.recipientName,
    items: input.items,
    generatedAt: input.generatedAt,
    dashboardUrl: input.dashboardUrl,
  });

  return sendTemplateEmail(template, recipients, {
    category: "system",
  });
}

type DigestEvent = DigestEventItem & {
  created_at: string;
  category: string;
};

export async function sendDailyDigestEmail(input: {
  userId?: string | null;
  recipientEmail: string | null;
  recipientName?: string | null;
  events: DigestEvent[];
  scopeLabel: string;
}): Promise<boolean> {
  const config = resolveEmailConfig();
  if (!config) return false;

  const recipients = normalizeRecipients([input.recipientEmail, config.adminEmail]);
  if (!recipients.length) return false;

  const template = renderDigestDailyEmail({
    recipientName: input.recipientName,
    events: input.events,
    scopeLabel: input.scopeLabel,
    unsubscribeUrl: resolveUnsubscribeUrl({ userId: input.userId, category: "system" }),
  });

  return sendTemplateEmail(template, recipients, {
    userId: input.userId,
    category: "system",
  });
}
