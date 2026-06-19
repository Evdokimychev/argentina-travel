import type { LocaleCode } from "@/types/locale";
import type { TransferLocation, TransferSearchParams } from "@/lib/intui/types";

function resolveIntuiHost(lang: LocaleCode): string {
  if (lang === "ru") return "ru.intui.travel";
  if (lang === "es") return "es.intui.travel";
  if (lang === "pt") return "pt.intui.travel";
  return "en.intui.travel";
}

function appendGpsParams(url: URL, location: TransferLocation, prefix: "origin" | "dest"): void {
  if (location.type === "airport" && location.code) {
    if (prefix === "origin") {
      url.searchParams.set("iata", location.code);
    } else {
      url.searchParams.set("iataTo", location.code);
    }
    return;
  }

  if (location.lat != null && location.lng != null) {
    if (prefix === "origin") {
      url.searchParams.set("gpsLatFrom", String(location.lat));
      url.searchParams.set("gpsLngFrom", String(location.lng));
    } else {
      url.searchParams.set("gpsLat", String(location.lat));
      url.searchParams.set("gpsLng", String(location.lng));
    }
  }
}

export function buildIntuiTransferSearchUrl(
  params: Pick<TransferSearchParams, "origin" | "destination" | "date" | "time" | "adults" | "children" | "infants" | "lang"> & {
    partnerId: string;
  }
): string {
  const url = new URL(`https://${resolveIntuiHost(params.lang)}/transfer/`);
  url.searchParams.set("api3", "");

  if (params.partnerId) {
    url.searchParams.set("partnerID", params.partnerId);
  }

  appendGpsParams(url, params.origin, "origin");
  appendGpsParams(url, params.destination, "dest");

  if (params.date) url.searchParams.set("date", params.date);
  if (params.time) url.searchParams.set("time", params.time);
  if (params.adults > 0) url.searchParams.set("adults", String(params.adults));
  if (params.children > 0) url.searchParams.set("children", String(params.children));
  if (params.infants > 0) url.searchParams.set("infants", String(params.infants));

  return url.toString();
}

export function buildIntuiTransferBookUrl(input: {
  bookPath: string;
  lang: LocaleCode;
  partnerId: string;
}): string {
  const trimmed = input.bookPath.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const host = resolveIntuiHost(input.lang);
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const url = new URL(`https://${host}${path}`);
  url.searchParams.set("api3", "");
  if (input.partnerId) {
    url.searchParams.set("partnerID", input.partnerId);
  }
  return url.toString();
}
