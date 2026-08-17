import { NextResponse } from "next/server";
import { LeadCaptureError, submitNewsletter } from "@/lib/lead-capture";
import { checkSecurityRateLimit, getClientIp } from "@/lib/rate-limit";
import { fetchSiteForms } from "@/lib/site-settings-server";
import {
  LeadCaptureValidationError,
  NEWSLETTER_REQUEST_MAX_BYTES,
  normalizeNewsletterSubmission,
  readLimitedJson,
} from "@/lib/lead-capture-validation";
import { verifyGuestFormProtection } from "@/lib/forms/captcha-server";

export async function POST(request: Request) {
  const forms = await fetchSiteForms();
  if (!forms.newsletterEnabled) {
    return NextResponse.json({ error: "Подписка временно отключена." }, { status: 404 });
  }

  const ip = getClientIp(request);
  const limit = await checkSecurityRateLimit(`newsletter:ip:${ip}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  try {
    const rawBody = await readLimitedJson(request, NEWSLETTER_REQUEST_MAX_BYTES);
    const rawFields =
      rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)
        ? (rawBody as Record<string, unknown>)
        : {};
    const protection = await verifyGuestFormProtection({
      request,
      formId: "newsletter",
      captchaToken:
        typeof rawFields.captchaToken === "string" ? rawFields.captchaToken : null,
      honeypot: typeof rawFields.honeypot === "string" ? rawFields.honeypot : null,
    });
    if (!protection.ok) {
      if (protection.kind === "configuration") {
        return NextResponse.json(
          { error: "Защита подписки временно недоступна." },
          { status: 503 },
        );
      }
      return NextResponse.json({ ok: true });
    }

    const body = normalizeNewsletterSubmission(rawBody);

    await submitNewsletter({
      email: body.email,
      source: body.source,
      locale: body.locale,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof LeadCaptureValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof LeadCaptureError) {
      const status =
        error.code === "validation" ? 400 : error.code === "not_configured" ? 503 : 500;
      const message =
        error.code === "database"
          ? "Не удалось оформить подписку. Попробуйте позже."
          : error.message;
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({ error: "Не удалось оформить подписку. Попробуйте позже." }, { status: 500 });
  }
}
