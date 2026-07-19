import { NextResponse } from "next/server";
import {
  LeadCaptureError,
  resolveContactKind,
  submitContact,
} from "@/lib/lead-capture";
import { fetchSiteFeatures, fetchSiteForms } from "@/lib/site-settings-server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { ContactSubmissionKind } from "@/types/database";
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
  const limit = await checkRateLimit(`contact:ip:${ip}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  try {
    const body = (await request.json()) as {
      kind?: ContactSubmissionKind;
      name?: string;
      email?: string | null;
      phone?: string | null;
      message?: string;
      context?: Record<string, unknown>;
      pageUrl?: string | null;
      tourSlug?: string | null;
      productSlug?: string | null;
      serviceSlug?: string | null;
      organizerApplication?: boolean;
      captchaToken?: string | null;
      honeypot?: string | null;
    };

    const protection = await verifyGuestFormProtection({
      request,
      formId: "contact",
      captchaToken: body.captchaToken,
      honeypot: body.honeypot,
    });
    if (!protection.ok) {
      if (protection.kind === "configuration") {
        return NextResponse.json({ error: "Защита формы временно недоступна." }, { status: 503 });
      }
      return NextResponse.json({ ok: true });
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const kind =
      body.kind ??
      resolveContactKind({
        tourSlug: body.tourSlug,
        productSlug: body.productSlug,
        serviceSlug: body.serviceSlug,
        organizerApplication: body.organizerApplication,
      });

    if (kind === "organizer_application") {
      const features = await fetchSiteFeatures();
      if (!features.allowOrganizerSignup) {
        return NextResponse.json(
          { error: "Приём заявок организаторов временно приостановлен." },
          { status: 403 }
        );
      }
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
    if (error instanceof LeadCaptureError) {
      const status =
        error.code === "validation" ? 400 : error.code === "not_configured" ? 503 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
