export const PROFILE_COUNTRIES = [
  "Россия",
  "Аргентина",
  "Украина",
  "Казахстан",
  "Беларусь",
  "Германия",
  "США",
  "Испания",
  "Франция",
  "Италия",
  "Бразилия",
  "Чили",
  "Уругвай",
  "Парагвай",
  "Другая",
] as const;

export type ProfileCountry = (typeof PROFILE_COUNTRIES)[number];

export const DEFAULT_PROFILE_COUNTRY: ProfileCountry = "Россия";

const PROFILE_COUNTRY_FLAGS: Partial<Record<ProfileCountry, string>> = {
  Россия: "🇷🇺",
  Аргентина: "🇦🇷",
  Украина: "🇺🇦",
  Казахстан: "🇰🇿",
  Беларусь: "🇧🇾",
  Германия: "🇩🇪",
  США: "🇺🇸",
  Испания: "🇪🇸",
  Франция: "🇫🇷",
  Италия: "🇮🇹",
  Бразилия: "🇧🇷",
  Чили: "🇨🇱",
  Уругвай: "🇺🇾",
  Парагвай: "🇵🇾",
};

export function getProfileCountryFlag(country: string): string {
  return PROFILE_COUNTRY_FLAGS[country as ProfileCountry] ?? "🌍";
}

const PROFILE_TO_PHONE_ISO: Partial<Record<ProfileCountry, string>> = {
  Россия: "RU",
  Аргентина: "AR",
  Украина: "UA",
  Казахстан: "KZ",
  Беларусь: "BY",
  Германия: "DE",
  США: "US",
  Испания: "ES",
  Франция: "FR",
  Италия: "IT",
  Бразилия: "BR",
  Чили: "CL",
  Уругвай: "UY",
};

/** ISO-код страны для форматирования телефона по полю «Страна» в профиле. */
export function resolvePhoneCountryIsoFromProfile(country: string): string {
  return PROFILE_TO_PHONE_ISO[country as ProfileCountry] ?? "RU";
}
