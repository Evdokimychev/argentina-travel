import { NextResponse } from "next/server";
import { LeadCaptureError, submitNewsletter } from "@/lib/lead-capture";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { fetchSiteForms } from "@/lib/site-settings-server";
import { verifyGuestFormProtection } from "@/lib/forms/captcha-server";

export async function POST(request: Request) {
  const forms = await fetchSiteForms();
  if (!forms.newsletterEnabled) {
    return NextResponse.json({ error: "Подписка временно отключена." }, { status: 404 });
  }

  const ip = getClientIp(request);
  const limit = await checkRateLimit(`newsletter:ip:${ip}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      source?: string;
      locale?: string | null;
      captchaToken?: string | null;
      honeypot?: string | null;
    };

    const protection = await verifyGuestFormProtection({
      request,
      formId: "newsletter",
      captchaToken: body.captchaToken,
      honeypot: body.honeypot,
    });
    if (!protection.ok) {
      if (protection.kind === "configuration") {
        return NextResponse.json({ error: "Защита подписки временно недоступна." }, { status: 503 });
      }
      return NextResponse.json({ ok: true });
    }

    if (!body.email?.trim()) {
      return NextResponse.json({ error: "Укажите email." }, { status: 400 });
    }

    await submitNewsletter({
      email: body.email,
      source: body.source,
      locale: body.locale,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof LeadCaptureError) {
      const status =
        error.code === "validation" ? 400 : error.code === "not_configured" ? 503 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Не удалось оформить подписку. Попробуйте позже." }, { status: 500 });
  }
}
