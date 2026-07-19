import { sendOperationalEmail } from "@/lib/notifications/email-delivery";
import {
  renderEmailLayout,
  stripHtml,
} from "@/lib/notifications/email-templates";

/** Optional durable alerts for new leads and operational requests. */

export async function notifyLeadCaptured(input: {
  subject: string;
  html: string;
}): Promise<void> {
  const subject = input.subject.replace(/[\r\n]+/g, " ").trim().slice(0, 300);
  if (!subject) return;

  await sendOperationalEmail({
    includeAdminCopy: true,
    subject,
    html: renderEmailLayout(input.html, { previewText: subject }),
    text: stripHtml(input.html),
    category: "lead",
  });
}
