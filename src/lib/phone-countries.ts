export interface PhoneCountry {
  iso: string;
  name: string;
  dialCode: string;
  flag: string;
  nationalLength: number;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "RU", name: "Россия", dialCode: "7", flag: "🇷🇺", nationalLength: 10 },
  { iso: "AR", name: "Аргентина", dialCode: "54", flag: "🇦🇷", nationalLength: 10 },
  { iso: "US", name: "США", dialCode: "1", flag: "🇺🇸", nationalLength: 10 },
  { iso: "UA", name: "Украина", dialCode: "380", flag: "🇺🇦", nationalLength: 9 },
  { iso: "BY", name: "Беларусь", dialCode: "375", flag: "🇧🇾", nationalLength: 9 },
  { iso: "KZ", name: "Казахстан", dialCode: "7", flag: "🇰🇿", nationalLength: 10 },
  { iso: "DE", name: "Германия", dialCode: "49", flag: "🇩🇪", nationalLength: 10 },
  { iso: "ES", name: "Испания", dialCode: "34", flag: "🇪🇸", nationalLength: 9 },
  { iso: "BR", name: "Бразилия", dialCode: "55", flag: "🇧🇷", nationalLength: 11 },
  { iso: "CL", name: "Чили", dialCode: "56", flag: "🇨🇱", nationalLength: 9 },
  { iso: "UY", name: "Уругвай", dialCode: "598", flag: "🇺🇾", nationalLength: 8 },
  { iso: "GB", name: "Великобритания", dialCode: "44", flag: "🇬🇧", nationalLength: 10 },
  { iso: "FR", name: "Франция", dialCode: "33", flag: "🇫🇷", nationalLength: 9 },
  { iso: "IT", name: "Италия", dialCode: "39", flag: "🇮🇹", nationalLength: 10 },
];

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0];

const byIso = new Map(PHONE_COUNTRIES.map((country) => [country.iso, country]));
const byDialLength = [...PHONE_COUNTRIES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length
);

export function getPhoneCountry(iso: string): PhoneCountry {
  return byIso.get(iso) ?? DEFAULT_PHONE_COUNTRY;
}

export function resolveCountryFromDialCode(
  dialCode: string,
  currentIso?: string
): PhoneCountry | null {
  const digits = dialCode.replace(/\D/g, "").slice(0, 4);
  if (!digits) return null;

  const exactMatches = PHONE_COUNTRIES.filter((country) => country.dialCode === digits);
  if (exactMatches.length === 1) return exactMatches[0];
  if (exactMatches.length > 1) {
    return exactMatches.find((country) => country.iso === currentIso) ?? exactMatches[0];
  }

  const prefixMatches = PHONE_COUNTRIES.filter((country) => country.dialCode.startsWith(digits));
  if (prefixMatches.length === 1) return prefixMatches[0];

  if (currentIso) {
    const current = getPhoneCountry(currentIso);
    if (current.dialCode.startsWith(digits)) return current;
  }

  return null;
}

export function buildInternationalPhoneFromParts(
  dialCode: string,
  nationalDigits: string
): string {
  const code = dialCode.replace(/\D/g, "");
  const national = nationalDigits.replace(/\D/g, "");
  if (!code || !national) return "";
  return `+${code}${national}`;
}

export function formatNationalDigits(digits: string, country: PhoneCountry): string {
  const value = digits.replace(/\D/g, "").slice(0, country.nationalLength);

  if (country.iso === "RU" || country.iso === "KZ") {
    if (value.length <= 3) return value;
    if (value.length <= 6) return `${value.slice(0, 3)} ${value.slice(3)}`;
    if (value.length <= 8) {
      return `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
    }
    return `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6, 8)} ${value.slice(8)}`;
  }

  if (value.length <= 3) return value;
  if (value.length <= 6) return `${value.slice(0, 3)} ${value.slice(3)}`;
  return `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
}

export function buildInternationalPhone(country: PhoneCountry, nationalDigits: string): string {
  const digits = nationalDigits.replace(/\D/g, "");
  if (!digits) return "";
  return `+${country.dialCode}${digits}`;
}

export function parseInternationalPhone(input: string): {
  country: PhoneCountry;
  nationalDigits: string;
} | null {
  let digits = input.trim().replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  for (const country of byDialLength) {
    if (!digits.startsWith(country.dialCode)) continue;

    const nationalDigits = digits.slice(country.dialCode.length);
    if (nationalDigits.length === 0) {
      return { country, nationalDigits: "" };
    }

    if (nationalDigits.length <= country.nationalLength) {
      return { country, nationalDigits };
    }
  }

  return null;
}

export function detectCountryFromDigits(
  digits: string,
  currentCountry: PhoneCountry
): { country: PhoneCountry; nationalDigits: string } | null {
  const normalized = digits.replace(/\D/g, "");
  if (!normalized) return null;

  for (const country of byDialLength) {
    if (!normalized.startsWith(country.dialCode)) continue;

    const nationalDigits = normalized.slice(country.dialCode.length);
    if (nationalDigits.length === 0) continue;

    if (
      nationalDigits.length <= country.nationalLength &&
      (country.iso !== currentCountry.iso || normalized.length > currentCountry.nationalLength)
    ) {
      return { country, nationalDigits };
    }
  }

  return null;
}

export function formatPhoneDisplay(country: PhoneCountry, nationalDigits: string): string {
  const national = nationalDigits.replace(/\D/g, "");
  if (!national) return `+${country.dialCode}`;
  return `+${country.dialCode} ${formatNationalDigits(national, country)}`;
}

export function parsePhoneInput(
  raw: string,
  fallbackCountry: PhoneCountry
): {
  country: PhoneCountry;
  nationalDigits: string;
  international: string;
  display: string;
} {
  const trimmed = raw.trim();

  if (!trimmed || trimmed === "+") {
    return {
      country: fallbackCountry,
      nationalDigits: "",
      international: "",
      display: `+${fallbackCountry.dialCode}`,
    };
  }

  const normalized = trimmed.startsWith("+") ? trimmed : `+${trimmed.replace(/\D/g, "")}`;
  const parsed = parseInternationalPhone(normalized);

  if (parsed) {
    const international = buildInternationalPhone(parsed.country, parsed.nationalDigits);
    return {
      country: parsed.country,
      nationalDigits: parsed.nationalDigits,
      international,
      display: parsed.nationalDigits
        ? formatPhoneDisplay(parsed.country, parsed.nationalDigits)
        : `+${parsed.country.dialCode}`,
    };
  }

  const digits = normalized.replace(/\D/g, "");
  if (!digits) {
    return {
      country: fallbackCountry,
      nationalDigits: "",
      international: "",
      display: "+",
    };
  }

  const resolved =
    resolveCountryFromDialCode(digits, fallbackCountry.iso) ??
    PHONE_COUNTRIES.find((country) => digits.startsWith(country.dialCode)) ??
    fallbackCountry;

  if (digits.startsWith(resolved.dialCode)) {
    const nationalDigits = digits.slice(resolved.dialCode.length);
    const international = nationalDigits ? buildInternationalPhone(resolved, nationalDigits) : "";
    return {
      country: resolved,
      nationalDigits,
      international,
      display: nationalDigits
        ? formatPhoneDisplay(resolved, nationalDigits)
        : `+${digits}`,
    };
  }

  if (resolved.dialCode.startsWith(digits)) {
    return {
      country: resolved,
      nationalDigits: "",
      international: "",
      display: `+${digits}`,
    };
  }

  const international = buildInternationalPhone(fallbackCountry, digits);
  return {
    country: fallbackCountry,
    nationalDigits: digits.slice(0, fallbackCountry.nationalLength),
    international,
    display: formatPhoneDisplay(fallbackCountry, digits),
  };
}

export function formatInternationalPhone(international: string): string {
  const parsed = parseInternationalPhone(international);
  if (!parsed) return international;

  const formattedNational = formatNationalDigits(parsed.nationalDigits, parsed.country);
  return `+${parsed.country.dialCode} ${formattedNational}`.trim();
}

export function splitInternationalPhone(international: string): {
  country: PhoneCountry;
  nationalDigits: string;
} {
  const parsed = parseInternationalPhone(international);
  if (parsed) return parsed;

  return {
    country: DEFAULT_PHONE_COUNTRY,
    nationalDigits: international.replace(/\D/g, "").slice(-DEFAULT_PHONE_COUNTRY.nationalLength),
  };
}
