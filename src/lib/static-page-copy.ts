import { t } from "@/lib/i18n";
import type { I18nLocale } from "@/lib/i18n/config";
import { getServerSyncMessages } from "@/lib/i18n/sync-messages";

/** Resolve static page copy for SSR metadata and JSON-LD. */
export function resolveStaticPageCopy(
  key: string,
  fallback: string,
  locale?: I18nLocale
): string {
  const messages = getServerSyncMessages(locale);
  const value = t(messages, key, key);
  return value !== key ? value : fallback;
}

/** Replace `{name}` placeholders in i18n strings. */
export function interpolateCopy(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
}
