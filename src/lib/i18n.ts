import type { LocaleCode } from "@/types/locale";
import { toI18nLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

type Messages = Record<string, string>;

const jsonLoaders: Record<LocaleCode, () => Promise<{ default: Messages }>> = {
  ru: () => import("@/locales/ru/common.json").then((m) => ({ default: m.default as Messages })),
  es: () => import("@/locales/es/common.json").then((m) => ({ default: m.default as Messages })),
  en: () => import("@/locales/en/common.json").then((m) => ({ default: m.default as Messages })),
  pt: () => import("@/locales/pt/common.json").then((m) => ({ default: m.default as Messages })),
};

const cache: Partial<Record<LocaleCode, Messages>> = {};

async function loadJsonMessages(locale: LocaleCode): Promise<Messages> {
  const mod = await jsonLoaders[locale]();
  return mod.default;
}

/** Merge legacy JSON bundles with E39 chrome dictionaries (dictionary wins on overlap). */
export async function loadMessages(locale: LocaleCode): Promise<Messages> {
  if (cache[locale]) return cache[locale]!;

  const json = await loadJsonMessages(locale);
  const chrome = getDictionary(toI18nLocale(locale));
  const merged = { ...json, ...chrome };
  cache[locale] = merged;
  return merged;
}

export function t(messages: Messages, key: string, fallback?: string): string {
  return messages[key] ?? fallback ?? key;
}
