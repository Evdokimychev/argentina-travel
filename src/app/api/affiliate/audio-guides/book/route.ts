import { NextResponse } from "next/server";
import { logWeGoTripAffiliateClick, resolveWeGoTripAffiliateUrl } from "@/lib/wegottrip/affiliate";
import { getWeGoTripProductById } from "@/lib/wegottrip/client";
import { isTravelpayoutsConfigured } from "@/lib/travelpayouts";
import type { CurrencyCode, LocaleCode } from "@/types/locale";

const LOCALES = new Set<LocaleCode>(["ru", "en", "es", "pt"]);
const CURRENCIES = new Set<CurrencyCode>(["RUB", "USD", "EUR", "ARS", "BRL", "CLP", "UYU", "GBP", "CAD", "AUD", "CHF"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = Number.parseInt(searchParams.get("productId") ?? "", 10);
  const checkout = searchParams.get("checkout") === "1" || searchParams.get("checkout") === "true";
  const localeParam = searchParams.get("locale")?.trim() ?? "ru";
  const locale = LOCALES.has(localeParam as LocaleCode) ? (localeParam as LocaleCode) : "ru";
  const currencyParam = searchParams.get("currency")?.trim()?.toUpperCase() ?? "USD";
  const currency = CURRENCIES.has(currencyParam as CurrencyCode)
    ? (currencyParam as CurrencyCode)
    : "USD";

  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const product = await getWeGoTripProductById({ productId, locale, currency });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!isTravelpayoutsConfigured()) {
    return NextResponse.json({ error: "Affiliate booking is not available" }, { status: 503 });
  }

  const partnerUrl = await resolveWeGoTripAffiliateUrl({ product, locale, checkout });

  await logWeGoTripAffiliateClick({
    productId: product.id,
    citySlug: product.city.slug,
    partnerUrl,
    referer: request.headers.get("referer") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.redirect(partnerUrl, 302);
}
