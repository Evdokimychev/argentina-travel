import { NextResponse } from "next/server";
import { searchWeGoTrip } from "@/lib/wegottrip/client";
import type { CurrencyCode, LocaleCode } from "@/types/locale";

const LOCALES = new Set<LocaleCode>(["ru", "en", "es", "pt"]);
const CURRENCIES = new Set<CurrencyCode>(["RUB", "USD", "EUR", "ARS", "BRL", "CLP", "UYU", "GBP", "CAD", "AUD", "CHF"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? searchParams.get("query")?.trim() ?? "";
  const localeParam = searchParams.get("locale")?.trim() ?? "ru";
  const locale = LOCALES.has(localeParam as LocaleCode) ? (localeParam as LocaleCode) : "ru";
  const currencyParam = searchParams.get("currency")?.trim()?.toUpperCase() ?? "USD";
  const currency = CURRENCIES.has(currencyParam as CurrencyCode)
    ? (currencyParam as CurrencyCode)
    : "USD";

  if (query.length < 3) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchWeGoTrip({ query, locale, currency });
  return NextResponse.json({ results });
}
