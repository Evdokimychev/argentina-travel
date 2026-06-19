/**
 * Optional email alerts for new leads (Resend).
 * Set RESEND_API_KEY + LEADS_NOTIFY_EMAIL in env.
 */

export async function notifyLeadCaptured(input: {
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.LEADS_NOTIFY_EMAIL?.trim();
  const from = process.env.LEADS_NOTIFY_FROM?.trim() ?? "onboarding@resend.dev";

  if (!apiKey || !to) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: input.subject,
        html: input.html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Non-blocking — lead is already persisted
  }
}
