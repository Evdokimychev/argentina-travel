import type { LocaleCode } from "@/types/locale";
import { DEFAULT_LOCALE } from "@/types/locale";
import {
  DEFAULT_I18N_LOCALE,
  type I18nLocale,
  toI18nLocale,
} from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import ruCommon from "@/locales/ru/common.json";
import enCommon from "@/locales/en/common.json";
import esCommon from "@/locales/es/common.json";
import ptCommon from "@/locales/pt/common.json";

const COMMON_MESSAGES: Record<LocaleCode, Record<string, string>> = {
  ru: ruCommon as Record<string, string>,
  en: enCommon as Record<string, string>,
  es: esCommon as Record<string, string>,
  pt: ptCommon as Record<string, string>,
};

/** Synchronous message bundle for SSR and client bootstrap (common JSON + chrome dictionary). */
export function getSyncMessages(locale: LocaleCode = DEFAULT_LOCALE): Record<string, string> {
  const common = COMMON_MESSAGES[locale] ?? COMMON_MESSAGES.ru;
  const chrome = getDictionary(toI18nLocale(locale));
  return { ...common, ...chrome };
}

export function localeCodeFromI18n(locale: I18nLocale): LocaleCode {
  return locale;
}

/** Server-side bundle: cookie/path locale with Russian fallback. */
export function getServerSyncMessages(locale?: I18nLocale): Record<string, string> {
  return getSyncMessages(localeCodeFromI18n(locale ?? DEFAULT_I18N_LOCALE));
}
