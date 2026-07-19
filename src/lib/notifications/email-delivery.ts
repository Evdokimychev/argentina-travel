import {
  escapeHtml,
  renderBookingReminder24hEmail,
  renderTripPrepReminderEmail,
  renderBookingConfirmedEmail,
  renderBookingLookupCodeEmail,
  renderNewMessageEmail,
  renderBookingStatusChangedEmail,
  renderContentFreshnessReportEmail,
  renderDigestDailyEmail,
  renderEmailLayout,
  renderPrivacyDeleteCompletedEmail,
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
import { fetchSiteEmail } from "@/lib/site-settings-server";

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
const EMAIL_MAX_ATTEMPTS = 5;

type EmailOutboxRow = {
  id: string;
  from_email: string;
  recipients: string[];
  subject: string;
  html_body: string;
  text_body: string;
  headers: Record<string, string> | null;
  attempts: number;
};

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

function nextEmailAttemptAt(attempts: number): string {
  const delayMs = Math.min(60 * 60_000, 60_000 * 2 ** Math.max(0, attempts - 1));
  return new Date(Date.now() + delayMs).toISOString();
}

async function deliverEmailOutboxRow(
  config: EmailConfig,
  row: EmailOutboxRow,
): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (supabase as any).from("email_delivery_outbox");
  const { data: claimed, error: claimError } = await table
    .update({ status: "sending", attempts: row.attempts + 1, last_attempt_at: new Date().toISOString() })
    .eq("id", row.id)
    .in("status", ["pending", "failed"])
    .select("id")
    .maybeSingle();
  if (claimError || !claimed) return false;

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": row.id,
      },
      body: JSON.stringify({
        from: row.from_email,
        to: row.recipients,
        subject: row.subject,
        html: row.html_body,
        text: row.text_body,
        headers: row.headers ?? undefined,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (response.ok) {
      const responseBody = (await response.json().catch(() => null)) as { id?: string } | null;
      await table
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString(),
          provider_message_id: responseBody?.id ?? null,
          last_error: null,
          next_attempt_at: null,
        })
        .eq("id", row.id);
      return true;
    }

    const attempts = row.attempts + 1;
    await table
      .update({
        status: attempts >= EMAIL_MAX_ATTEMPTS ? "dead" : "failed",
        last_error: `Resend HTTP ${response.status}`,
        next_attempt_at: attempts >= EMAIL_MAX_ATTEMPTS ? null : nextEmailAttemptAt(attempts),
      })
      .eq("id", row.id);
    return false;
  } catch (error) {
    const attempts = row.attempts + 1;
    await table
      .update({
        status: attempts >= EMAIL_MAX_ATTEMPTS ? "dead" : "failed",
        last_error: error instanceof Error ? error.message.slice(0, 1000) : "Email delivery failed",
        next_attempt_at: attempts >= EMAIL_MAX_ATTEMPTS ? null : nextEmailAttemptAt(attempts),
      })
      .eq("id", row.id);
    return false;
  }
}

async function sendEmail(config: EmailConfig, input: SendEmailInput): Promise<boolean> {
  if (!input.to.length) return false;

  try {
    const settings = await fetchSiteEmail();
    const senderName = settings.senderName.replace(/[\r\n<>]+/g, " ").trim().slice(0, 120);
    const senderAddress = config.from.match(/<([^>]+)>/)?.[1] ?? config.from;
    const from = senderName ? `${senderName} <${senderAddress}>` : config.from;
    const replyTo = settings.replyToEmail?.trim();
    const footerFallback = "Настройки уведомлений можно изменить в личном кабинете.";
    const html = settings.footerText
      ? input.html.replace(footerFallback, escapeHtml(settings.footerText))
      : input.html;
    const text = settings.footerText
      ? input.text.replace(footerFallback, settings.footerText)
      : input.text;
    const supabase = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("email_delivery_outbox")
      .insert({
        from_email: from,
        recipients: input.to,
        subject: input.subject,
        html_body: html,
        text_body: text,
        headers: {
          ...(input.headers ?? {}),
          ...(replyTo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)
            ? { "Reply-To": replyTo }
            : {}),
        },
        status: "pending",
        next_attempt_at: new Date().toISOString(),
      })
      .select("id, from_email, recipients, subject, html_body, text_body, headers, attempts")
      .single();

    if (error || !data) return false;
    return deliverEmailOutboxRow(config, data as EmailOutboxRow);
  } catch {
    return false;
  }
}

/**
 * Queues non-preference operational mail through the same durable outbox as
 * transactional messages. Callers must pass already escaped HTML fragments.
 */
export async function sendOperationalEmail(input: {
  recipientEmails?: Array<string | null | undefined>;
  includeAdminCopy?: boolean;
  subject: string;
  html: string;
  text: string;
  category?: "lead" | "organizer" | "required";
}): Promise<boolean> {
  const config = resolveEmailConfig();
  if (!config) return false;
  const settings = await fetchSiteEmail();
  if (input.category === "lead" && !settings.leadAlertsEnabled) return false;
  if (input.category === "organizer" && !settings.organizerAlertsEnabled) return false;

  const subject = input.subject.replace(/[\r\n]+/g, " ").trim().slice(0, 300);
  if (!subject) return false;

  const recipients = normalizeRecipients([
    ...(input.recipientEmails ?? []),
    input.includeAdminCopy ? config.adminEmail : null,
  ]);
  if (!recipients.length) return false;

  return sendEmail(config, {
    to: recipients,
    subject,
    html: input.html,
    text: input.text,
  });
}

export async function processEmailOutboxRetries(limit = 50): Promise<{
  queued: number;
  delivered: number;
  failed: number;
}> {
  const config = resolveEmailConfig();
  if (!config) return { queued: 0, delivered: 0, failed: 0 };

  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (supabase as any).from("email_delivery_outbox");
  const staleSendingBefore = new Date(Date.now() - 15 * 60_000).toISOString();
  await table
    .update({ status: "failed", next_attempt_at: new Date().toISOString(), last_error: "Stale sending lease" })
    .eq("status", "sending")
    .lt("updated_at", staleSendingBefore);

  const deliveredRetentionCutoff = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
  const deadRetentionCutoff = new Date(Date.now() - 90 * 24 * 60 * 60_000).toISOString();
  await table.delete().eq("status", "delivered").lt("delivered_at", deliveredRetentionCutoff);
  await table.delete().eq("status", "dead").lt("updated_at", deadRetentionCutoff);

  const { data, error } = await table
    .select("id, from_email, recipients, subject, html_body, text_body, headers, attempts")
    .in("status", ["pending", "failed"])
    .lte("next_attempt_at", new Date().toISOString())
    .lt("attempts", EMAIL_MAX_ATTEMPTS)
    .order("next_attempt_at", { ascending: true })
    .limit(Math.max(1, Math.min(100, Math.floor(limit))));

  if (error || !Array.isArray(data)) {
    throw new Error(error?.message ?? "Не удалось прочитать очередь писем");
  }

  let delivered = 0;
  for (const row of data as EmailOutboxRow[]) {
    if (await deliverEmailOutboxRow(config, row)) delivered += 1;
  }
  return { queued: data.length, delivered, failed: data.length - delivered };
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

  return sendEmail(config, {
    to: recipients,
    subject: template.subject,
    html: template.html,
    text: template.text,
    headers: buildListUnsubscribeHeader(unsubscribeUrl),
  });

}

export async function sendBookingLookupCodeEmail(input: {
  recipientEmail: string;
  code: string;
}): Promise<boolean> {
  const config = resolveEmailConfig();
  if (!config) return false;
  const template = renderBookingLookupCodeEmail(input.code);
  return sendEmail(config, {
    to: normalizeRecipients([input.recipientEmail]),
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
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

export async function sendConversationNewMessageEmail(input: {
  userId?: string | null;
  recipientEmail: string | null;
  recipientName?: string | null;
  senderName: string;
  tourTitle: string;
  bookingId?: string | null;
  messageBody: string;
  messageHref: string;
}): Promise<boolean> {
  const recipients = normalizeRecipients([input.recipientEmail]);
  if (!recipients.length) return false;

  const template = renderNewMessageEmail({
    recipientName: input.recipientName,
    senderName: input.senderName,
    tourTitle: input.tourTitle,
    bookingId: input.bookingId,
    messageBody: input.messageBody,
    messageHref: input.messageHref,
    unsubscribeUrl: resolveUnsubscribeUrl({ userId: input.userId, category: "booking" }),
  });

  return sendTemplateEmail(template, recipients, {
    userId: input.userId,
    category: "booking",
  });
}

export async function sendBookingReminder24hEmail(input: {
  userId?: string | null;
  recipientEmail: string | null;
  recipientName?: string | null;
  bookingId: string;
  tourTitle: string;
  startDate: string;
  detailsHref: string;
}): Promise<boolean> {
  const recipients = normalizeRecipients([input.recipientEmail]);
  if (!recipients.length) return false;

  const template = renderBookingReminder24hEmail({
    recipientName: input.recipientName,
    bookingId: input.bookingId,
    tourTitle: input.tourTitle,
    startDate: input.startDate,
    detailsHref: input.detailsHref,
    unsubscribeUrl: resolveUnsubscribeUrl({ userId: input.userId, category: "booking" }),
  });

  return sendTemplateEmail(template, recipients, {
    userId: input.userId,
    category: "booking",
  });
}

export async function sendTripPrepReminderEmail(input: {
  userId?: string | null;
  recipientEmail: string | null;
  recipientName?: string | null;
  bookingId: string;
  tourTitle: string;
  startDate: string;
  daysBefore: 7 | 3 | 1;
  prepHref: string;
}): Promise<boolean> {
  const recipients = normalizeRecipients([input.recipientEmail]);
  if (!recipients.length) return false;

  const template = renderTripPrepReminderEmail({
    recipientName: input.recipientName,
    bookingId: input.bookingId,
    tourTitle: input.tourTitle,
    startDate: input.startDate,
    daysBefore: input.daysBefore,
    prepHref: input.prepHref,
    unsubscribeUrl: resolveUnsubscribeUrl({ userId: input.userId, category: "booking" }),
  });

  return sendTemplateEmail(template, recipients, {
    userId: input.userId,
    category: "booking",
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

export async function sendPrivacyDeleteCompletedEmail(input: {
  recipientEmail: string | null;
  recipientName?: string | null;
  requestId: string;
  completedAt?: string;
}): Promise<boolean> {
  const config = resolveEmailConfig();
  if (!config) return false;

  const recipients = normalizeRecipients([input.recipientEmail]);
  if (!recipients.length) return false;

  const template = renderPrivacyDeleteCompletedEmail({
    recipientName: input.recipientName,
    requestId: input.requestId,
    completedAt: input.completedAt,
    supportEmail: config.adminEmail,
  });

  return sendEmail(config, {
    to: recipients,
    subject: template.subject,
    html: template.html,
    text: template.text,
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

export async function sendContentFreshnessReportEmail(input: {
  recipientEmails: string[];
  recipientName?: string | null;
  items: ContentFreshnessReportItem[];
  generatedAt?: string;
  dashboardUrl?: string;
}): Promise<boolean> {
  if (!(await fetchSiteEmail()).contentFreshnessAlertsEnabled) return false;
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
  if (!(await fetchSiteEmail()).dailyDigestEnabled) return false;
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
