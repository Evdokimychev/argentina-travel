import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { formatCurrencyAmount } from "@/lib/currency";
import type { CurrencyCode, LocaleCode } from "@/types/locale";
import type { FlightPriceTeaser } from "@/lib/flights/hub-price-teasers";

export function resolveOfferCurrency(code: string): CurrencyCode {
  const normalized = code.trim().toUpperCase();
  const allowed: CurrencyCode[] = ["RUB", "USD", "EUR", "ARS", "BRL", "CLP", "UYU", "GBP", "CAD", "AUD", "CHF"];
  return allowed.includes(normalized as CurrencyCode) ? (normalized as CurrencyCode) : "USD";
}

export function formatTeaserPrice(teaser: FlightPriceTeaser, locale: LocaleCode): string {
  return formatCurrencyAmount(
    Math.round(teaser.price),
    resolveOfferCurrency(teaser.currency),
    locale
  );
}

export function formatTeaserDate(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM", { locale: ru });
  } catch {
    return "";
  }
}

export function buildTeaserBookHref(teaser: FlightPriceTeaser, locale: LocaleCode): string {
  if (teaser.ticketPath) {
    return `/api/affiliate/flights/book?${new URLSearchParams({
      ticket: teaser.ticketPath,
      route: teaser.routeId,
      locale,
    })}`;
  }
  return `/flights?${new URLSearchParams({
    origin: teaser.origin,
    destination: teaser.destination,
  })}`;
}
