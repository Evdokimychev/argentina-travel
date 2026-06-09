import { TourLanguage } from "@/types";

export interface LanguageFilterOption {
  language: TourLanguage;
  flag: string;
  nativeName: string;
  description: string;
}

export const LANGUAGE_FILTER_OPTIONS: LanguageFilterOption[] = [
  {
    language: "Русский",
    flag: "🇷🇺",
    nativeName: "Русский",
    description: "Экскурсии и сопровождение на русском языке",
  },
  {
    language: "Испанский",
    flag: "🇪🇸",
    nativeName: "Español",
    description: "Программа на испанском — основной язык страны",
  },
  {
    language: "Английский",
    flag: "🇬🇧",
    nativeName: "English",
    description: "Международные группы, англоязычные гиды",
  },
  {
    language: "Португальский",
    flag: "🇵🇹",
    nativeName: "Português",
    description: "Туры для говорящих на португальском",
  },
];
