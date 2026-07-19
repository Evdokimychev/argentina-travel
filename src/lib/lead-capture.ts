import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { notifyLeadCaptured } from "@/lib/leads-notify";
import { escapeHtml } from "@/lib/notifications/email-templates";
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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function submitNewsletter(input: SubmitNewsletterInput): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new LeadCaptureError("Supabase is not configured.", "not_configured");
  }

  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) {
    throw new LeadCaptureError("Invalid email.", "validation");
  }

  const row: NewsletterSubscriberInsert = {
    email,
    source: input.source ?? "footer",
    locale: input.locale ?? null,
  };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("newsletter_subscribers").insert(row);

  if (error) {
    if (error.code === "23505") return;
    throw new LeadCaptureError(error.message, "database");
  }

  void notifyLeadCaptured({
    subject: `Новая подписка: ${email.replace(/[\r\n]+/g, " ")}`,
    html: `<p>Email: <strong>${escapeHtml(email)}</strong></p><p>Источник: ${escapeHtml(row.source ?? "footer")}</p>`,
  });
}

export async function submitContact(input: SubmitContactInput): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new LeadCaptureError("Supabase is not configured.", "not_configured");
  }

  const name = input.name.trim();
  if (!name) {
    throw new LeadCaptureError("Name is required.", "validation");
  }

  const email = input.email?.trim() ? normalizeEmail(input.email) : null;
  const phone = input.phone?.trim() || null;

  if (!email && !phone) {
    throw new LeadCaptureError("Email or phone is required.", "validation");
  }

  const row: ContactSubmissionInsert = {
    kind: input.kind,
    name,
    email,
    phone,
    message: input.message?.trim() ?? "",
    context: (input.context ?? {}) as Json,
    page_url: input.pageUrl ?? null,
  };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("contact_submissions").insert(row);

  if (error) {
    throw new LeadCaptureError(error.message, "database");
  }

  void notifyLeadCaptured({
    subject: `Новая заявка: ${input.kind}`,
    html: `<p><strong>${escapeHtml(name)}</strong></p>
<p>Email: ${escapeHtml(email ?? "—")}<br/>Телефон: ${escapeHtml(phone ?? "—")}</p>
<p>${escapeHtml(row.message ?? "")}</p>
<pre>${escapeHtml(JSON.stringify(row.context, null, 2))}</pre>`,
  });
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
