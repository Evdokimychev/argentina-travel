import { NextResponse } from "next/server";
import { getTransferLocationById } from "@/data/transfer-locations";
import {
  createTransferSearchAffiliateUrl,
  logTransferAffiliateClick,
} from "@/lib/intui/transfers-affiliate";
import type { TransferLocation } from "@/lib/intui/types";
import { isTravelpayoutsConfigured, TravelpayoutsError } from "@/lib/travelpayouts";
import type { CurrencyCode, LocaleCode } from "@/types/locale";

const LOCALES = new Set<LocaleCode>(["ru", "en", "es", "pt"]);
const CURRENCIES = new Set<CurrencyCode>([
  "RUB",
  "USD",
  "EUR",
  "ARS",
  "BRL",
  "CLP",
  "UYU",
  "GBP",
  "CAD",
  "AUD",
  "CHF",
]);

function readInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function readFloat(value: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveLocation(input: {
  id?: string;
  type?: string;
  code?: string;
  name?: string;
  lat?: number;
  lng?: number;
}): TransferLocation | null {
  if (input.id) {
    const preset = getTransferLocationById(input.id);
    if (preset) return preset;
  }

  const name = input.name?.trim();
  if (!name) return null;

  const code = input.code?.trim().toUpperCase();
  const lat = input.lat;
  const lng = input.lng;
  const type = input.type === "airport" || input.type === "point" ? input.type : code ? "airport" : "point";

  return {
    id: input.id?.trim() || `${type}-${code ?? name}`,
    name,
    type,
    code,
    lat,
    lng,
  };
}

function buildRouteKey(origin: TransferLocation, destination: TransferLocation): string {
  const originKey = origin.code ?? origin.id;
  const destinationKey = destination.code ?? destination.id;
  return `${originKey}-${destinationKey}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale")?.trim() ?? "ru";
  const locale = LOCALES.has(localeParam as LocaleCode) ? (localeParam as LocaleCode) : "ru";
  const currencyParam = searchParams.get("currency")?.trim().toUpperCase() ?? "USD";
  const currency = CURRENCIES.has(currencyParam as CurrencyCode)
    ? (currencyParam as CurrencyCode)
    : "USD";

  const origin = resolveLocation({
    id: searchParams.get("originId")?.trim(),
    type: searchParams.get("originType")?.trim(),
    code: searchParams.get("originCode")?.trim(),
    name: searchParams.get("originName")?.trim(),
    lat: readFloat(searchParams.get("originLat")),
    lng: readFloat(searchParams.get("originLng")),
  });

  const destination = resolveLocation({
    id: searchParams.get("destinationId")?.trim(),
    type: searchParams.get("destinationType")?.trim(),
    code: searchParams.get("destinationCode")?.trim(),
    name: searchParams.get("destinationName")?.trim(),
    lat: readFloat(searchParams.get("destinationLat")),
    lng: readFloat(searchParams.get("destinationLng")),
  });

  const date = searchParams.get("date")?.trim() ?? "";
  const time = searchParams.get("time")?.trim() || "12:00";

  if (!origin || !destination || !date) {
    return NextResponse.json({ error: "Invalid search parameters" }, { status: 400 });
  }

  if (!isTravelpayoutsConfigured()) {
    return NextResponse.json({ error: "Affiliate search is not available" }, { status: 503 });
  }

  const routeKey = buildRouteKey(origin, destination);

  try {
    const partnerUrl = await createTransferSearchAffiliateUrl(
      {
        origin,
        destination,
        date,
        time,
        adults: Math.max(1, readInt(searchParams.get("adults"), 1)),
        children: readInt(searchParams.get("children"), 0),
        infants: readInt(searchParams.get("infants"), 0),
        lang: locale,
        currency,
      },
      routeKey
    );

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
