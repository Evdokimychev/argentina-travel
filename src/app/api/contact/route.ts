import { NextResponse } from "next/server";
import {
  LeadCaptureError,
  resolveContactKind,
  submitContact,
} from "@/lib/lead-capture";
import type { ContactSubmissionKind } from "@/types/database";

export async function POST(request: Request) {
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
    };

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
