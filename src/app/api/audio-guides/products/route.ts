import { NextResponse } from "next/server";
import { getWeGoTripPopularProducts } from "@/lib/wegottrip/client";
import { DEFAULT_WEGOTTRIP_CITY_ID, WEGOTTRIP_ARGENTINA_COUNTRY_ID } from "@/lib/wegottrip/constants";
import type { CurrencyCode, LocaleCode } from "@/types/locale";

const LOCALES = new Set<LocaleCode>(["ru", "en", "es", "pt"]);
const CURRENCIES = new Set<CurrencyCode>(["RUB", "USD", "EUR", "ARS", "BRL", "CLP", "UYU", "GBP", "CAD", "AUD", "CHF"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale")?.trim() ?? "ru";
  const locale = LOCALES.has(localeParam as LocaleCode) ? (localeParam as LocaleCode) : "ru";
  const currencyParam = searchParams.get("currency")?.trim()?.toUpperCase() ?? "USD";
  const currency = CURRENCIES.has(currencyParam as CurrencyCode)
    ? (currencyParam as CurrencyCode)
    : "USD";
  const cityId = Number.parseInt(searchParams.get("city") ?? "", 10);
  const countryId = Number.parseInt(searchParams.get("country") ?? "", 10);
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10);

  const pagination = await getWeGoTripPopularProducts({
    locale,
    currency,
    cityId: Number.isFinite(cityId) ? cityId : DEFAULT_WEGOTTRIP_CITY_ID,
    countryId: Number.isFinite(countryId) ? countryId : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  return NextResponse.json({
    products: pagination.results,
    pagination: {
      count: pagination.count,
      pages: pagination.pages,
      current: pagination.current,
      next: pagination.next,
    },
    defaults: {
      cityId: DEFAULT_WEGOTTRIP_CITY_ID,
      countryId: WEGOTTRIP_ARGENTINA_COUNTRY_ID,
    },
    source: pagination.count > 0 ? "live" : "fallback",
  });
}
