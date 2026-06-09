import { LanguageOption, CurrencyOption } from "@/types/locale";

export const LANGUAGES: LanguageOption[] = [
  { code: "ru", label: "Русский", nativeName: "Русский", flag: "🇷🇺" },
  { code: "es", label: "Español", nativeName: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "pt", label: "Português", nativeName: "Português", flag: "🇵🇹" },
];

/** Mock exchange rates — replace with API fetch in production */
export const CURRENCIES: CurrencyOption[] = [
  {
    code: "RUB",
    name: { ru: "Российский рубль", es: "Rublo ruso", en: "Russian ruble", pt: "Rublo russo" },
    symbol: "₽",
    rateFromUsd: 92,
  },
  {
    code: "USD",
    name: { ru: "Доллар США", es: "Dólar estadounidense", en: "US dollar", pt: "Dólar americano" },
    symbol: "$",
    rateFromUsd: 1,
  },
  {
    code: "EUR",
    name: { ru: "Евро", es: "Euro", en: "Euro", pt: "Euro" },
    symbol: "€",
    rateFromUsd: 0.92,
  },
  {
    code: "ARS",
    name: { ru: "Аргентинский песо", es: "Peso argentino", en: "Argentine peso", pt: "Peso argentino" },
    symbol: "$",
    rateFromUsd: 875,
  },
  {
    code: "BRL",
    name: { ru: "Бразильский реал", es: "Real brasileño", en: "Brazilian real", pt: "Real brasileiro" },
    symbol: "R$",
    rateFromUsd: 5.05,
  },
  {
    code: "CLP",
    name: { ru: "Чилийский песо", es: "Peso chileno", en: "Chilean peso", pt: "Peso chileno" },
    symbol: "$",
    rateFromUsd: 940,
  },
  {
    code: "UYU",
    name: { ru: "Уругвайский песо", es: "Peso uruguayo", en: "Uruguayan peso", pt: "Peso uruguayo" },
    symbol: "$",
    rateFromUsd: 39.5,
  },
  {
    code: "GBP",
    name: { ru: "Британский фунт", es: "Libra esterlina", en: "British pound", pt: "Libra esterlina" },
    symbol: "£",
    rateFromUsd: 0.79,
  },
  {
    code: "CAD",
    name: { ru: "Канадский доллар", es: "Dólar canadiense", en: "Canadian dollar", pt: "Dólar canadense" },
    symbol: "$",
    rateFromUsd: 1.36,
  },
  {
    code: "AUD",
    name: { ru: "Австралийский доллар", es: "Dólar australiano", en: "Australian dollar", pt: "Dólar australiano" },
    symbol: "$",
    rateFromUsd: 1.53,
  },
  {
    code: "CHF",
    name: { ru: "Швейцарский франк", es: "Franco suizo", en: "Swiss franc", pt: "Franco suíço" },
    symbol: "₣",
    rateFromUsd: 0.88,
  },
];

export const POPULAR_CURRENCIES = ["RUB", "USD", "EUR"] as const;

export function getLanguage(code: string) {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function getCurrency(code: string) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}
