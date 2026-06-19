import type { I18nLocale } from "@/lib/i18n/config";
import { enDictionary } from "./en";
import { esDictionary } from "./es";
import { ruDictionary, type DictionaryKey } from "./ru";

export type { DictionaryKey };

const DICTIONARIES: Record<I18nLocale, Record<DictionaryKey, string>> = {
  ru: ruDictionary,
  es: esDictionary,
  en: enDictionary,
};

export function getDictionary(locale: I18nLocale): Record<DictionaryKey, string> {
  return DICTIONARIES[locale];
}
