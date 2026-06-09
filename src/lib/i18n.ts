import { LocaleCode } from "@/types/locale";

type Messages = Record<string, string>;

const loaders: Record<LocaleCode, () => Promise<{ default: Messages }>> = {
  ru: () => import("@/locales/ru/common.json").then((m) => ({ default: m.default as Messages })),
  es: () => import("@/locales/es/common.json").then((m) => ({ default: m.default as Messages })),
  en: () => import("@/locales/en/common.json").then((m) => ({ default: m.default as Messages })),
  pt: () => import("@/locales/pt/common.json").then((m) => ({ default: m.default as Messages })),
};

const cache: Partial<Record<LocaleCode, Messages>> = {};

export async function loadMessages(locale: LocaleCode): Promise<Messages> {
  if (cache[locale]) return cache[locale]!;
  const mod = await loaders[locale]();
  cache[locale] = mod.default;
  return mod.default;
}

export function t(messages: Messages, key: string, fallback?: string): string {
  return messages[key] ?? fallback ?? key;
}
