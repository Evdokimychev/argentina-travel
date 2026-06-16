import { NextResponse } from "next/server";
import {
  buildAviasalesSearchUrl,
  resolveAviasalesMarket,
} from "@/lib/travelpayouts/aviasales";
import type { FlightSearchParams } from "@/lib/travelpayouts/aviasales/types";
import {
  createFlightAffiliateRedirectUrl,
  logFlightAffiliateClick,
} from "@/lib/travelpayouts/flights-affiliate";
import { isTravelpayoutsConfigured, TravelpayoutsError } from "@/lib/travelpayouts";
import type { LocaleCode } from "@/types/locale";

const LOCALES = new Set<LocaleCode>(["ru", "en", "es", "pt"]);

function readInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseSearchParams(searchParams: URLSearchParams): FlightSearchParams | null {
  const origin = searchParams.get("origin")?.trim().toUpperCase() ?? "";
  const destination = searchParams.get("destination")?.trim().toUpperCase() ?? "";
  const departDate = searchParams.get("departDate")?.trim() ?? "";
  const returnDate = searchParams.get("returnDate")?.trim() || undefined;
  const tripType = searchParams.get("tripType") === "round_trip" ? "round_trip" : "one_way";

  if (!origin || origin.length !== 3 || !destination || destination.length !== 3 || !departDate) {
    return null;
  }

  if (tripType === "round_trip" && !returnDate) {
    return null;
  }

  return {
    origin,
    destination,
    departDate,
    returnDate,
    adults: Math.max(1, readInt(searchParams.get("adults"), 1)),
    children: readInt(searchParams.get("children"), 0),
    infants: readInt(searchParams.get("infants"), 0),
    tripType,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = parseSearchParams(searchParams);

  if (!params) {
    return NextResponse.json({ error: "Invalid search parameters" }, { status: 400 });
  }

  if (!isTravelpayoutsConfigured()) {
    return NextResponse.json({ error: "Affiliate search is not available" }, { status: 503 });
  }

  const localeParam = searchParams.get("locale")?.trim() ?? "ru";
  const locale = LOCALES.has(localeParam as LocaleCode) ? (localeParam as LocaleCode) : "ru";
  const market = resolveAviasalesMarket(locale);
  const aviasalesUrl = buildAviasalesSearchUrl(market.host, params);
  const routeKey = `${params.origin}-${params.destination}`;

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
