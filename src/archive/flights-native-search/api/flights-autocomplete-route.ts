import { NextResponse } from "next/server";
import { searchAviasalesPlaces } from "@/lib/travelpayouts/aviasales/autocomplete";
import type { LocaleCode } from "@/types/locale";

const LOCALES = new Set<LocaleCode>(["ru", "en", "es", "pt"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term")?.trim() ?? "";
  const localeParam = searchParams.get("locale")?.trim() ?? "ru";
  const locale = LOCALES.has(localeParam as LocaleCode) ? (localeParam as LocaleCode) : "ru";

  if (term.length < 2) {
    return NextResponse.json({ places: [] });
  }

  const places = await searchAviasalesPlaces(term, locale);
  return NextResponse.json({ places });
}
