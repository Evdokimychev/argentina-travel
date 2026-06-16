import { NextResponse } from "next/server";
import { getWeGoTripProductById } from "@/lib/wegottrip/client";
import type { CurrencyCode, LocaleCode } from "@/types/locale";

const LOCALES = new Set<LocaleCode>(["ru", "en", "es", "pt"]);
const CURRENCIES = new Set<CurrencyCode>(["RUB", "USD", "EUR", "ARS", "BRL", "CLP", "UYU", "GBP", "CAD", "AUD", "CHF"]);

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const productId = Number.parseInt(id, 10);
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale")?.trim() ?? "ru";
  const locale = LOCALES.has(localeParam as LocaleCode) ? (localeParam as LocaleCode) : "ru";
  const currencyParam = searchParams.get("currency")?.trim()?.toUpperCase() ?? "USD";
  const currency = CURRENCIES.has(currencyParam as CurrencyCode)
    ? (currencyParam as CurrencyCode)
    : "USD";

  const product = await getWeGoTripProductById({ productId, locale, currency });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product, source: "live" });
}
