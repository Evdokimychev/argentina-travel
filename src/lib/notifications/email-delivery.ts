import {
  escapeHtml,
  formatRecipientName,
  formatRuDate,
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
import { formatBookingDisplayNumber } from "@/lib/booking-display";
import { resolveManagedEmailTemplate } from "@/lib/notifications/email-template-resolver-server";
import type {
  EmailTemplateEventKey,
  EmailTemplateVariables,
} from "@/lib/notifications/email-template-contract";
import { BOOKING_STATUS_LABELS } from "@/data/booking-statuses";
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
import type { BookingStatus } from "@/types/tourist";
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

type ManagedEmailRequest<K extends EmailTemplateEventKey> = {
  eventKey: K;
  locale: string;
  variables: EmailTemplateVariables<K>;
  unsubscribeUrl?: string | null;
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

export type OperationalEmailResult =
  | { status: "accepted"; providerMessageId?: string }
  | { status: "failed"; providerStatus?: number }
  | { status: "skipped" };

type EmailDeliveryResult = Exclude<OperationalEmailResult, { status: "skipped" }>;

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
): Promise<EmailDeliveryResult> {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (supabase as any).from("email_delivery_outbox");
  const { data: claimed, error: claimError } = await table
    .update({ status: "sending", attempts: row.attempts + 1, last_attempt_at: new Date().toISOString() })
    .eq("id", row.id)
    .in("status", ["pending", "failed"])
    .select("id")
    .maybeSingle();
  if (claimError || !claimed) return { status: "failed" };

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
      return {
        status: "accepted",
        ...(responseBody?.id ? { providerMessageId: responseBody.id } : {}),
      };
    }

    const attempts = row.attempts + 1;
    await table
      .update({
        status: attempts >= EMAIL_MAX_ATTEMPTS ? "dead" : "failed",
        last_error: `Resend HTTP ${response.status}`,
        next_attempt_at: attempts >= EMAIL_MAX_ATTEMPTS ? null : nextEmailAttemptAt(attempts),
      })
      .eq("id", row.id);
    return { status: "failed", providerStatus: response.status };
  } catch (error) {
    const attempts = row.attempts + 1;
    await table
      .update({
        status: attempts >= EMAIL_MAX_ATTEMPTS ? "dead" : "failed",
        last_error: error instanceof Error ? error.message.slice(0, 1000) : "Email delivery failed",
        next_attempt_at: attempts >= EMAIL_MAX_ATTEMPTS ? null : nextEmailAttemptAt(attempts),
      })
      .eq("id", row.id);
    return { status: "failed" };
  }
}

async function enqueueAndDeliverEmail(
  config: EmailConfig,
  input: SendEmailInput,
): Promise<EmailDeliveryResult> {
  if (!input.to.length) return { status: "failed" };

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

    if (error || !data) return { status: "failed" };
    return deliverEmailOutboxRow(config, data as EmailOutboxRow);
  } catch {
    return { status: "failed" };
  }
}

async function sendEmail(config: EmailConfig, input: SendEmailInput): Promise<boolean> {
  return (await enqueueAndDeliverEmail(config, input)).status === "accepted";
}

/**
 * Queues non-preference operational mail through the same durable outbox as
 * transactional messages. Callers must pass already escaped HTML fragments.
 */
export async function sendOperationalEmail<
  K extends EmailTemplateEventKey = "operations.alert",
>(input: {
  recipientEmails?: Array<string | null | undefined>;
  includeAdminCopy?: boolean;
  subject: string;
  html: string;
  text: string;
  category?: "lead" | "organizer" | "required";
  managed?: ManagedEmailRequest<K>;
}): Promise<OperationalEmailResult> {
  const config = resolveEmailConfig();
  if (!config) return { status: "skipped" };
  const settings = await fetchSiteEmail();
  if (input.category === "lead" && !settings.leadAlertsEnabled) return { status: "skipped" };
  if (input.category === "organizer" && !settings.organizerAlertsEnabled) return { status: "skipped" };

  const subject = input.subject.replace(/[\r\n]+/g, " ").trim().slice(0, 300);
  if (!subject) return { status: "skipped" };

  const recipients = normalizeRecipients([
    ...(input.recipientEmails ?? []),
    input.includeAdminCopy ? config.adminEmail : null,
  ]);
  if (!recipients.length) return { status: "skipped" };

  const fallback: EmailTemplateResult = {
    subject,
    html: input.html,
    text: input.text,
  };
  const managed = input.managed ?? {
    eventKey: "operations.alert",
    locale: "ru",
    variables: {
      alert_title: subject,
      alert_details: input.text.trim() || "Проверьте новое событие в панели управления.",
    },
  } as ManagedEmailRequest<K>;
  const resolved = await resolveManagedEmailTemplate({
    eventKey: managed.eventKey,
    locale: managed.locale,
    variables: managed.variables,
    fallback,
    layoutOptions: { unsubscribeUrl: managed.unsubscribeUrl },
  });

  return enqueueAndDeliverEmail(config, {
    to: recipients,
    subject: resolved.subject,
    html: resolved.html,
    text: resolved.text,
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
    if ((await deliverEmailOutboxRow(config, row)).status === "accepted") delivered += 1;
  }
  return { queued: data.length, delivered, failed: data.length - delivered };
}

export async function processEmailOutboxIds(ids: string[]): Promise<{
  queued: number;
  delivered: number;
  failed: number;
}> {
  const uniqueIds = [...new Set(ids)].slice(0, 50);
  if (!uniqueIds.length) return { queued: 0, delivered: 0, failed: 0 };
  const config = resolveEmailConfig();
  if (!config) throw new Error("Email provider is not configured");

  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("email_delivery_outbox")
    .select("id, from_email, recipients, subject, html_body, text_body, headers, attempts")
    .in("id", uniqueIds)
    .in("status", ["pending", "failed"])
    .lt("attempts", EMAIL_MAX_ATTEMPTS)
    .limit(50);
  if (error || !Array.isArray(data)) throw new Error(error?.message ?? "Не удалось прочитать письма");

  let delivered = 0;
  for (const row of data as EmailOutboxRow[]) {
    if ((await deliverEmailOutboxRow(config, row)).status === "accepted") delivered += 1;
  }
  return { queued: data.length, delivered, failed: data.length - delivered };
}

async function sendTemplateEmail<K extends EmailTemplateEventKey>(
  template: EmailTemplateResult,
  recipients: string[],
  context: TransactionalSendContext,
  managed?: {
    eventKey: K;
    locale: string;
    variables: EmailTemplateVariables<K>;
    unsubscribeUrl?: string | null;
  },
): Promise<boolean> {
  const config = resolveEmailConfig();
  if (!config || !recipients.length) return false;

  const allowed = await shouldSendEmail(context);
  if (!allowed) return false;

  const unsubscribeUrl = resolveUnsubscribeUrl(context);
  const resolvedTemplate = managed
    ? await resolveManagedEmailTemplate({
        eventKey: managed.eventKey,
        locale: managed.locale,
        variables: managed.variables,
        fallback: template,
        layoutOptions: { unsubscribeUrl: managed.unsubscribeUrl },
      })
    : template;

  return sendEmail(config, {
    to: recipients,
    subject: resolvedTemplate.subject,
    html: resolvedTemplate.html,
    text: resolvedTemplate.text,
    headers: buildListUnsubscribeHeader(unsubscribeUrl),
  });

}

function bookingStatusLabel(status: string | null): string {
  if (!status) return "—";
  return BOOKING_STATUS_LABELS[status as BookingStatus] ?? status;
}

const PAYMENT_STATUS_LABELS: Record<"paid" | "partial" | "refunded", string> = {
  paid: "Оплата получена",
  partial: "Зафиксирована частичная оплата",
  refunded: "Оформлен возврат",
};

function daysUntilTripLabel(daysBefore: 7 | 3 | 1): string {
  if (daysBefore === 1) return "завтра";
  if (daysBefore === 3) return "через 3 дня";
  return "через неделю";
}

function listSummary(lines: string[], fallback: string): string {
  const summary = lines.map((line) => shortText(line, 240)).filter(Boolean).slice(0, 20).join("\n");
  return summary || fallback;
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

  const unsubscribeUrl = resolveUnsubscribeUrl({ userId: input.userId, category: "booking" });

  const template = renderBookingConfirmedEmail({
    recipientName: input.recipientName,
    bookingId: input.bookingId,
    tourTitle: input.tourTitle,
    guests: input.guests,
    startDate: input.startDate,
    endDate: input.endDate,
    unsubscribeUrl,
  });

  return sendTemplateEmail(template, recipients, {
    userId: input.userId,
    category: "booking",
  }, {
    eventKey: "booking.confirmed",
    locale: "ru",
    unsubscribeUrl,
    variables: {
      recipient_name: formatRecipientName(input.recipientName),
      booking_number: formatBookingDisplayNumber(input.bookingId),
      tour_title: input.tourTitle,
      start_date: input.startDate?.trim() || "уточняются",
      end_date: input.endDate?.trim() || "уточняются",
      guests: typeof input.guests === "number" && input.guests > 0 ? String(input.guests) : "уточняется",
      booking_url: absoluteUrl(`/profile/bookings/${encodeURIComponent(input.bookingId)}`),
    },
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

  const unsubscribeUrl = input.adminCopy
    ? null
    : resolveUnsubscribeUrl({ userId: input.userId, category: "booking" });

  return sendTemplateEmail(template, primaryRecipients, {
    userId: input.adminCopy ? null : input.userId,
    category: "booking",
  }, input.adminCopy ? {
    eventKey: "booking.status_changed_admin",
    locale: "ru",
    variables: {
      booking_number: formatBookingDisplayNumber(input.bookingId),
      tour_title: input.tourTitle,
      previous_status: bookingStatusLabel(input.fromStatus),
      status: bookingStatusLabel(input.toStatus),
      admin_url: absoluteUrl("/admin/bookings"),
    },
  } : {
    eventKey: "booking.status_changed",
    locale: "ru",
    unsubscribeUrl,
    variables: {
      recipient_name: formatRecipientName(input.recipientName),
      booking_number: formatBookingDisplayNumber(input.bookingId),
      tour_title: input.tourTitle,
      previous_status: bookingStatusLabel(input.fromStatus),
      status: bookingStatusLabel(input.toStatus),
      booking_url: absoluteUrl(`/profile/bookings/${encodeURIComponent(input.bookingId)}`),
    },
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

  const unsubscribeUrl = resolveUnsubscribeUrl({ userId: input.userId, category: "payment" });

  return sendTemplateEmail(template, recipients, {
    userId: input.userId,
    category: "payment",
  }, {
    eventKey: "payment.received",
    locale: "ru",
    unsubscribeUrl,
    variables: {
      recipient_name: formatRecipientName(input.recipientName),
      booking_number: formatBookingDisplayNumber(input.bookingId),
      tour_title: input.tourTitle,
      payment_status: PAYMENT_STATUS_LABELS[input.paymentStatus],
      amount: typeof input.amountUsd === "number" && input.amountUsd > 0
        ? `${input.amountUsd.toLocaleString("ru-RU")} USD`
        : "уточняется",
      payment_method: input.providerLabel?.trim() || "не указан",
      booking_url: absoluteUrl(`/profile/bookings/${encodeURIComponent(input.bookingId)}`),
    },
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
  }, {
    eventKey: "messaging.new_message",
    locale: "ru",
    unsubscribeUrl: resolveUnsubscribeUrl({ userId: input.userId, category: "booking" }),
    variables: {
      recipient_name: formatRecipientName(input.recipientName),
      sender_name: input.senderName.trim() || "Собеседник",
      tour_title: input.tourTitle,
      booking_number: input.bookingId
        ? formatBookingDisplayNumber(input.bookingId)
        : "без номера заявки",
      message_preview: shortText(input.messageBody, 220),
      message_url: absoluteUrl(input.messageHref),
    },
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
  }, {
    eventKey: "booking.reminder_24h",
    locale: "ru",
    unsubscribeUrl: resolveUnsubscribeUrl({ userId: input.userId, category: "booking" }),
    variables: {
      recipient_name: formatRecipientName(input.recipientName),
      booking_number: formatBookingDisplayNumber(input.bookingId),
      tour_title: input.tourTitle,
      start_date: formatRuDate(input.startDate),
      details_url: absoluteUrl(input.detailsHref),
    },
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
  }, {
    eventKey: "trip_prep.reminder",
    locale: "ru",
    unsubscribeUrl: resolveUnsubscribeUrl({ userId: input.userId, category: "booking" }),
    variables: {
      recipient_name: formatRecipientName(input.recipientName),
      tour_title: input.tourTitle,
      start_date: formatRuDate(input.startDate),
      time_until_start: daysUntilTripLabel(input.daysBefore),
      prep_url: absoluteUrl(input.prepHref),
    },
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
  }, {
    eventKey: "review.moderated",
    locale: "ru",
    unsubscribeUrl: resolveUnsubscribeUrl({ userId: input.userId, category: "reviews" }),
    variables: {
      recipient_name: formatRecipientName(input.touristName),
      tour_title: input.tourTitle,
      moderation_result: input.action === "approve" ? "Отзыв опубликован" : "Отзыв не опубликован",
      moderator_note: input.note?.trim() || "Комментарий не добавлен",
      tour_url: absoluteUrl(`/tours/${encodeURIComponent(input.tourSlug ?? "")}`),
    },
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

  return sendTemplateEmail(template, recipients, {
    category: "system",
  }, {
    eventKey: "privacy.delete_completed",
    locale: "ru",
    variables: {
      recipient_name: formatRecipientName(input.recipientName),
      request_number: input.requestId,
      completed_date: formatRuDate(input.completedAt),
      support_contact: config.adminEmail || "форма обратной связи на сайте",
      settings_url: absoluteUrl("/profile/settings"),
    },
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

  const template: EmailTemplateResult = {
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
  };

  await sendTemplateEmail(template, recipients, {
    category: "reviews",
  }, {
    eventKey: "review.organizer_published",
    locale: "ru",
    variables: {
      organizer_name: input.organizerName?.trim() || "организатор",
      tour_title: input.tourTitle,
      author_name: input.touristName?.trim() || "путешественник",
      rating: `${input.rating} из 5`,
      review_preview: shortText(input.reviewText),
      trip_date: input.tripDate?.trim() || "не указана",
      reviews_url: organizerReviewsUrl,
    },
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
  }, {
    eventKey: "content.freshness_report",
    locale: "ru",
    variables: {
      recipient_name: formatRecipientName(input.recipientName ?? "редакция"),
      report_date: formatRuDate(input.generatedAt ?? new Date()),
      total_count: String(input.items.length),
      critical_count: String(input.items.filter((item) => item.status === "critical").length),
      stale_count: String(input.items.filter((item) => item.status === "stale").length),
      items_summary: listSummary(
        input.items.map((item) => `${item.title} — ${item.ageDays} дн. без проверки`),
        "Материалов для проверки нет",
      ),
      dashboard_url: absoluteUrl(input.dashboardUrl ?? "/admin/content/freshness"),
    },
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
  }, {
    eventKey: "notifications.daily_digest",
    locale: "ru",
    unsubscribeUrl: resolveUnsubscribeUrl({ userId: input.userId, category: "system" }),
    variables: {
      recipient_name: formatRecipientName(input.recipientName),
      scope_label: input.scopeLabel,
      date: formatRuDate(),
      event_count: String(input.events.length),
      events_summary: listSummary(
        input.events.map((event) => `${event.title} — ${event.body}`),
        "За последние сутки новых событий не было",
      ),
    },
  });
}
