import {
  sendOperationalEmail,
  type OperationalEmailResult,
} from "@/lib/notifications/email-delivery";
import {
  renderEmailLayout,
  stripHtml,
} from "@/lib/notifications/email-templates";

/** Optional durable alerts for new leads and operational requests. */

export async function notifyLeadCaptured(input: {
  subject: string;
  html: string;
}): Promise<OperationalEmailResult> {
  const subject = input.subject.replace(/[\r\n]+/g, " ").trim().slice(0, 300);
  if (!subject) return { status: "skipped" };

  return sendOperationalEmail({
    includeAdminCopy: true,
    subject,
    html: renderEmailLayout(input.html, { previewText: subject }),
    text: stripHtml(input.html),
    category: "lead",
  });
}
