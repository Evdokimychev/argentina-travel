import { NextResponse } from "next/server";
import {
  fetchFlightPricesForDates,
  fetchLatestFlightPrices,
  resolveAviasalesMarket,
} from "@/lib/travelpayouts/aviasales";
import { isTravelpayoutsConfigured } from "@/lib/travelpayouts";
import type { LocaleCode } from "@/types/locale";

const LOCALES = new Set<LocaleCode>(["ru", "en", "es", "pt"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin")?.trim().toUpperCase() ?? "";
  const destination = searchParams.get("destination")?.trim().toUpperCase() ?? "";
  const departDate = searchParams.get("departDate")?.trim() ?? "";
  const returnDate = searchParams.get("returnDate")?.trim() ?? "";
  const tripType = searchParams.get("tripType") === "round_trip" ? "round_trip" : "one_way";
  const localeParam = searchParams.get("locale")?.trim() ?? "ru";
  const locale = LOCALES.has(localeParam as LocaleCode) ? (localeParam as LocaleCode) : "ru";
  const currencyParam = searchParams.get("currency")?.trim().toUpperCase();

  if (!origin || origin.length !== 3 || !destination || destination.length !== 3) {
    return NextResponse.json({ error: "Invalid origin or destination" }, { status: 400 });
  }

  const market = resolveAviasalesMarket(locale, currencyParam as never);
  const oneWay = tripType !== "round_trip";

  if (!isTravelpayoutsConfigured()) {
    return NextResponse.json({
      offers: [],
      currency: market.currency,
      source: "unconfigured",
    });
  }

  let offers;

  if (departDate) {
    offers = await fetchFlightPricesForDates({
      origin,
      destination,
      departureAt: departDate,
      returnAt: oneWay ? undefined : returnDate || undefined,
      currency: market.currency,
      market: market.market,
      oneWay,
      limit: 20,
    });
  } else {
    offers = await fetchLatestFlightPrices({
      origin,
      destination,
      currency: market.currency,
      limit: 10,
    });
  }

  return NextResponse.json({
    offers,
    currency: market.currency,
    source: departDate ? "prices_for_dates" : "latest",
  });
}
