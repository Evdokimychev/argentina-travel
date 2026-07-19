import { fetchSiteForms } from "@/lib/site-settings-server";
import { getClientIp } from "@/lib/rate-limit";
import { isCaptchaRequired, type CaptchaFormId } from "@/lib/forms/captcha-policy";

type TurnstileResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
};

export type GuestFormProtectionResult =
  | { ok: true }
  | { ok: false; kind: "bot" | "configuration" };

export async function verifyGuestFormProtection(input: {
  request: Request;
  formId: CaptchaFormId;
  captchaToken?: string | null;
  honeypot?: string | null;
}): Promise<GuestFormProtectionResult> {
  if (input.honeypot?.trim()) return { ok: false, kind: "bot" };

  const settings = await fetchSiteForms();
  if (!isCaptchaRequired(settings, input.formId)) return { ok: true };

  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!secret || !siteKey) return { ok: false, kind: "configuration" };
  const token = input.captchaToken?.trim();
  if (!token) return { ok: false, kind: "bot" };

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
      remoteip: getClientIp(input.request),
    });
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok) return { ok: false, kind: "bot" };
    const payload = (await response.json()) as TurnstileResponse;
    if (!payload.success) return { ok: false, kind: "bot" };
    if (payload.action && payload.action !== input.formId) return { ok: false, kind: "bot" };

    const requestHostname = new URL(input.request.url).hostname;
    if (
      payload.hostname &&
      requestHostname !== "localhost" &&
      payload.hostname !== requestHostname
    ) {
      return { ok: false, kind: "bot" };
    }
    return { ok: true };
  } catch {
    return { ok: false, kind: "bot" };
  }
}
