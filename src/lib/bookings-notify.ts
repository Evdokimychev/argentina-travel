/**
 * Optional email alerts for booking status changes (Resend).
 * Non-blocking — skipped when env is missing.
 */

export async function notifyBookingStatusChanged(input: {
  bookingId: string;
  tourTitle: string;
  contactEmail: string;
  contactName: string;
  fromStatus: string | null;
  toStatus: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.LEADS_NOTIFY_EMAIL?.trim();
  const from = process.env.LEADS_NOTIFY_FROM?.trim() ?? "onboarding@resend.dev";

  if (!apiKey || !to) return;

  const subject = `Статус заявки изменён: ${input.tourTitle}`;
  const html = `
    <p>Заявка <strong>${input.bookingId}</strong> — ${input.tourTitle}</p>
    <p>Турист: ${input.contactName} (${input.contactEmail})</p>
    <p>Статус: ${input.fromStatus ?? "—"} → <strong>${input.toStatus}</strong></p>
  `;

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
        subject,
        html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Non-blocking
  }
}
