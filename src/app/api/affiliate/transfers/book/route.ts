import { NextResponse } from "next/server";
import {
  createTransferBookAffiliateUrl,
  logTransferAffiliateClick,
} from "@/lib/intui/transfers-affiliate";
import { isTravelpayoutsConfigured, TravelpayoutsError } from "@/lib/travelpayouts";
import type { LocaleCode } from "@/types/locale";

const LOCALES = new Set<LocaleCode>(["ru", "en", "es", "pt"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookPath = searchParams.get("book")?.trim() ?? "";
  const routeKey = searchParams.get("route")?.trim() || "unknown";

  if (!bookPath) {
    return NextResponse.json({ error: "Book path is required" }, { status: 400 });
  }

  if (!isTravelpayoutsConfigured()) {
    return NextResponse.json({ error: "Affiliate booking is not available" }, { status: 503 });
  }

  const localeParam = searchParams.get("locale")?.trim() ?? "ru";
  const locale = LOCALES.has(localeParam as LocaleCode) ? (localeParam as LocaleCode) : "ru";

  try {
    const partnerUrl = await createTransferBookAffiliateUrl({
      bookPath,
      routeKey,
      locale,
    });

    await logTransferAffiliateClick({
      routeKey,
      partnerUrl,
      referer: request.headers.get("referer") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.redirect(partnerUrl, 302);
  } catch (error) {
    const message =
      error instanceof TravelpayoutsError ? error.message : "Failed to generate affiliate link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
