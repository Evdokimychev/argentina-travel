import { NextResponse } from "next/server";
import {
  buildAviasalesTicketUrl,
  resolveAviasalesMarket,
} from "@/lib/travelpayouts/aviasales";
import {
  createFlightAffiliateRedirectUrl,
  logFlightAffiliateClick,
} from "@/lib/travelpayouts/flights-affiliate";
import { isTravelpayoutsConfigured, TravelpayoutsError } from "@/lib/travelpayouts";
import type { LocaleCode } from "@/types/locale";

const LOCALES = new Set<LocaleCode>(["ru", "en", "es", "pt"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticket = searchParams.get("ticket")?.trim() ?? "";
  const routeKey = searchParams.get("route")?.trim() || "unknown";

  if (!ticket) {
    return NextResponse.json({ error: "Ticket path is required" }, { status: 400 });
  }

  if (!isTravelpayoutsConfigured()) {
    return NextResponse.json({ error: "Affiliate booking is not available" }, { status: 503 });
  }

  const localeParam = searchParams.get("locale")?.trim() ?? "ru";
  const locale = LOCALES.has(localeParam as LocaleCode) ? (localeParam as LocaleCode) : "ru";
  const market = resolveAviasalesMarket(locale);
  const aviasalesUrl = buildAviasalesTicketUrl(market.host, ticket);

  try {
    const partnerUrl = await createFlightAffiliateRedirectUrl({
      aviasalesUrl,
      routeKey,
    });

    await logFlightAffiliateClick({
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
