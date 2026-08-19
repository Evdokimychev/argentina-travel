import { NextResponse } from "next/server";
import {
  LeadCaptureError,
  resolveContactKind,
  submitContact,
} from "@/lib/lead-capture";
import { fetchSiteForms } from "@/lib/site-settings-server";
import { checkSecurityRateLimit, getClientIp } from "@/lib/rate-limit";
import type { ContactSubmissionKind } from "@/types/database";
import {
  CONTACT_REQUEST_MAX_BYTES,
  LeadCaptureValidationError,
  normalizeContactRequest,
  readLimitedJson,
} from "@/lib/lead-capture-validation";
import { verifyGuestFormProtection } from "@/lib/forms/captcha-server";

export async function POST(request: Request) {
  const forms = await fetchSiteForms();
  if (!forms.contactEnabled) {
    return NextResponse.json(
      { error: "Форма обращений временно отключена. Используйте доступные контакты." },
      { status: 404 },
    );
  }

  const ip = getClientIp(request);
  const limit = await checkSecurityRateLimit(`contact:ip:${ip}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  try {
    const rawBody = await readLimitedJson(request, CONTACT_REQUEST_MAX_BYTES);
    const rawFields =
      rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)
        ? (rawBody as Record<string, unknown>)
        : {};
    const protection = await verifyGuestFormProtection({
      request,
      formId: "contact",
      captchaToken:
        typeof rawFields.captchaToken === "string" ? rawFields.captchaToken : null,
      honeypot: typeof rawFields.honeypot === "string" ? rawFields.honeypot : null,
    });
    if (!protection.ok) {
      if (protection.kind === "configuration") {
        return NextResponse.json(
          { error: "Защита формы временно недоступна." },
          { status: 503 },
        );
      }
      return NextResponse.json({ ok: true });
    }

    const body = normalizeContactRequest(rawBody, request.url);
    const inferredKind = resolveContactKind({
      tourSlug: body.tourSlug,
      productSlug: body.productSlug,
      serviceSlug: body.serviceSlug,
      organizerApplication: body.organizerApplication,
    });
    const kind: ContactSubmissionKind =
      inferredKind === "general" ? body.kind ?? "general" : inferredKind;

    if (kind === "organizer_application") {
      return NextResponse.json(
        {
          error: "Заявку организатора отправьте через кабинет, а не через форму обратной связи.",
          code: "USE_ORGANIZER_APPLICATIONS",
        },
        { status: 400 },
      );
    }

    const context = {
      ...(body.context ?? {}),
      ...(body.tourSlug ? { tour_slug: body.tourSlug } : {}),
      ...(body.productSlug ? { product_slug: body.productSlug } : {}),
      ...(body.serviceSlug ? { service_slug: body.serviceSlug } : {}),
    };

    await submitContact({
      kind,
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message,
      context,
      pageUrl: body.pageUrl,
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
          ? "Не удалось сохранить обращение. Попробуйте позже."
          : error.message;
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json(
      { error: "Не удалось сохранить обращение. Попробуйте позже." },
      { status: 500 }
    );
  }
}
