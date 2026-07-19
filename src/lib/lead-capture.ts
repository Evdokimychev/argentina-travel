import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { notifyLeadCaptured } from "@/lib/leads-notify";
import { escapeHtml } from "@/lib/notifications/email-templates/utils";
import {
  LeadCaptureValidationError,
  normalizeContactSubmission,
  normalizeNewsletterSubmission,
} from "@/lib/lead-capture-validation";
import type {
  ContactSubmissionInsert,
  ContactSubmissionKind,
  Json,
  NewsletterSubscriberInsert,
} from "@/types/database";

export type SubmitNewsletterInput = {
  email: string;
  source?: string;
  locale?: string | null;
};

export type SubmitContactInput = {
  kind: ContactSubmissionKind;
  name: string;
  email?: string | null;
  phone?: string | null;
  message?: string;
  context?: Record<string, unknown>;
  pageUrl?: string | null;
};

export class LeadCaptureError extends Error {
  constructor(
    message: string,
    readonly code: "not_configured" | "validation" | "database" = "database"
  ) {
    super(message);
    this.name = "LeadCaptureError";
  }
}

export async function submitNewsletter(input: SubmitNewsletterInput): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new LeadCaptureError("Supabase is not configured.", "not_configured");
  }

  let normalized: ReturnType<typeof normalizeNewsletterSubmission>;
  try {
    normalized = normalizeNewsletterSubmission(input);
  } catch (error) {
    if (error instanceof LeadCaptureValidationError) {
      throw new LeadCaptureError(error.message, "validation");
    }
    throw error;
  }

  const row: NewsletterSubscriberInsert = {
    email: normalized.email,
    source: normalized.source,
    locale: normalized.locale,
  };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .upsert({ ...row, status: "active" }, { onConflict: "email" });

  if (error) {
    throw new LeadCaptureError(error.message, "database");
  }

  void notifyLeadCaptured({
    subject: `Новая подписка: ${normalized.email}`,
    html: `<p>Email: <strong>${escapeHtml(normalized.email)}</strong></p><p>Источник: ${escapeHtml(row.source ?? "footer")}</p>`,
  }).catch(() => console.error("[lead-notification] Newsletter delivery failed"));
}

export async function submitContact(input: SubmitContactInput): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new LeadCaptureError("Supabase is not configured.", "not_configured");
  }

  let normalized: ReturnType<typeof normalizeContactSubmission>;
  try {
    normalized = normalizeContactSubmission(input);
  } catch (error) {
    if (error instanceof LeadCaptureValidationError) {
      throw new LeadCaptureError(error.message, "validation");
    }
    throw error;
  }

  const row: ContactSubmissionInsert = {
    kind: normalized.kind,
    name: normalized.name,
    email: normalized.email,
    phone: normalized.phone,
    message: normalized.message,
    context: normalized.context as Json,
    page_url: normalized.pageUrl,
  };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("contact_submissions").insert(row);

  if (error) {
    throw new LeadCaptureError(error.message, "database");
  }

  void notifyLeadCaptured({
    subject: `Новая заявка: ${normalized.kind}`,
    html: `<p><strong>${escapeHtml(normalized.name)}</strong></p>
<p>Email: ${escapeHtml(normalized.email ?? "—")}<br/>Телефон: ${escapeHtml(normalized.phone ?? "—")}</p>
<p>${escapeHtml(normalized.message)}</p>
<pre>${escapeHtml(JSON.stringify(row.context, null, 2))}</pre>`,
  }).catch(() => console.error("[lead-notification] Contact delivery failed"));
}

export function resolveContactKind(params: {
  tourSlug?: string | null;
  productSlug?: string | null;
  serviceSlug?: string | null;
  organizerApplication?: boolean;
}): ContactSubmissionKind {
  if (params.organizerApplication) return "organizer_application";
  if (params.tourSlug) return "tour_inquiry";
  if (params.productSlug) return "product_inquiry";
  if (params.serviceSlug === "visa-consult") return "consultation";
  if (params.serviceSlug) return "service_request";
  return "general";
}
