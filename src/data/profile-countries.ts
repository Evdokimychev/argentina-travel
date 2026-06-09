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
