import { NextResponse } from "next/server";
import { LeadCaptureError, submitNewsletter } from "@/lib/lead-capture";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      source?: string;
      locale?: string | null;
    };

    if (!body.email?.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
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

    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
