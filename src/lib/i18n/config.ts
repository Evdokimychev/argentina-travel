import type { LocaleCode } from "@/types/locale";
import { LOCALE_STORAGE_KEY } from "@/types/locale";

/** Pilot i18n locales — content translation (E39.2) is separate. */
export const I18N_LOCALES = ["ru", "es", "en"] as const;
export type I18nLocale = (typeof I18N_LOCALES)[number];

export const DEFAULT_I18N_LOCALE: I18nLocale = "ru";

/** Locales exposed via optional URL prefix (/es/, /en/). Russian stays unprefixed. */
export const PREFIXED_I18N_LOCALES = ["es", "en"] as const;
export type PrefixedI18nLocale = (typeof PREFIXED_I18N_LOCALES)[number];

export const LOCALE_COOKIE_KEY = LOCALE_STORAGE_KEY;

export function isI18nLocale(value: string): value is I18nLocale {
  return (I18N_LOCALES as readonly string[]).includes(value);
}

export function isPrefixedI18nLocale(value: string): value is PrefixedI18nLocale {
  return (PREFIXED_I18N_LOCALES as readonly string[]).includes(value);
}

export function toI18nLocale(locale: LocaleCode): I18nLocale {
  return isI18nLocale(locale) ? locale : "en";
}
