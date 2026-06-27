import { normalizeLocationKey, resolveLocation, resolveMacroRegion } from "./locations";
import type { TourLocationInput, TourLocationWarning } from "./types";

const BRAZIL_MARKERS = ["бразил", "brazil", "brasil"];
const CHILE_MARKERS = ["чили", "chile"];
const PATAGONIA_MARKERS = ["патагон", "patagonia"];
const BA_MARKERS = ["buenos aires", "буэнос-айрес", "caba", "capital federal"];

function containsAny(text: string, markers: string[]): boolean {
  const normalized = normalizeLocationKey(text);
  return markers.some((marker) => normalized.includes(marker));
}

function isBuenosAires(text?: string | null): boolean {
  if (!text?.trim()) return false;
  const normalized = normalizeLocationKey(text);
  if (BA_MARKERS.some((m) => normalized.includes(m))) return true;
  const loc = resolveLocation(text);
  return loc?.slug === "buenos-aires";
}

function isBariloche(text?: string | null): boolean {
  if (!text?.trim()) return false;
  const loc = resolveLocation(text);
  return loc?.slug === "bariloche" || normalizeLocationKey(text).includes("bariloche");
}

function isIguazu(text?: string | null): boolean {
  if (!text?.trim()) return false;
  const normalized = normalizeLocationKey(text);
  return normalized.includes("iguazu") || normalized.includes("iguas") || normalized.includes("игуас");
}

function isPatagoniaMacro(text?: string | null): boolean {
  if (!text?.trim()) return false;
  return containsAny(text, PATAGONIA_MARKERS) || resolveMacroRegion(text) === "Патагония";
}

function isBrazilCountry(text?: string | null): boolean {
  if (!text?.trim()) return false;
  return containsAny(text, BRAZIL_MARKERS);
}

export function validateTourLocation(input: TourLocationInput): TourLocationWarning[] {
  const warnings: TourLocationWarning[] = [];
  const country = input.country?.trim() ?? "";
  const destination = input.destination?.trim() ?? "";
  const region = input.region?.trim() ?? "";

  if (isBuenosAires(destination) && isBrazilCountry(country)) {
    warnings.push({
      code: "ba-not-brazil",
      message: "Буэнос-Айрес указан как город в Бразилии",
    });
  }

  if (isBariloche(destination) && containsAny(country, CHILE_MARKERS)) {
    warnings.push({
      code: "bariloche-not-chile",
      message: "Барилоче указан в Чили — это город Аргентины",
    });
  }

  if (isIguazu(destination) && isPatagoniaMacro(region)) {
    warnings.push({
      code: "iguazu-not-patagonia",
      message: "Игуасу не относится к макрорегиону Патагония",
    });
  }

  if (isBrazilCountry(country) && !isBrazilCountry(destination) && containsAny(destination, ["аргент", "argentina"])) {
    warnings.push({
      code: "brazil-tour-argentina-display",
      message: "Тур в Бразилии не должен отображаться как Аргентина",
    });
  }

  if (isPatagoniaMacro(region) && isBuenosAires(destination) && !isPatagoniaMacro(destination)) {
    warnings.push({
      code: "patagonia-region-ba-destination",
      message: "Регион Патагония, но destination — Буэнос-Айрес",
    });
  }

  return warnings;
}

export function hasTourLocationMismatch(input: TourLocationInput): boolean {
  return validateTourLocation(input).length > 0;
}
