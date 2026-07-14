import { DEFAULT_PROFILE_COUNTRY, resolvePhoneCountryIsoFromProfile } from "@/data/profile-countries";
import {
  DEFAULT_PHONE_COUNTRY,
  buildInternationalPhone,
  getPhoneCountry,
  parseInternationalPhone,
} from "@/lib/phone-countries";

/** Authentication providers always receive an explicit user-entered password. */
export function resolvePasswordInput(input?: string): string {
  return input?.trim() ?? "";
}

export function normalizePhone(input: string, countryIso?: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parsedInternational = parseInternationalPhone(trimmed);
  if (parsedInternational) {
    const { country, nationalDigits } = parsedInternational;
    if (!nationalDigits || nationalDigits.length < country.nationalLength - 1) return null;
    return buildInternationalPhone(country, nationalDigits);
  }

  const country = getPhoneCountry(countryIso ?? DEFAULT_PHONE_COUNTRY.iso);
  const nationalDigits = trimmed.replace(/\D/g, "");
  if (nationalDigits.length < country.nationalLength - 1) return null;
  return buildInternationalPhone(country, nationalDigits.slice(0, country.nationalLength));
}

export function formatPhoneInput(value: string, countryIso?: string): string {
  const country = getPhoneCountry(countryIso ?? DEFAULT_PHONE_COUNTRY.iso);
  const digits = value.replace(/\D/g, "").slice(0, country.nationalLength);

  if (country.iso === "RU" || country.iso === "KZ") {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export { DEFAULT_PROFILE_COUNTRY, resolvePhoneCountryIsoFromProfile };
