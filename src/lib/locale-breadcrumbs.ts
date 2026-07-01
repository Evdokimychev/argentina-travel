import { t } from "@/lib/i18n";
import type { BreadcrumbJsonLdItem } from "@/lib/breadcrumb-json-ld";
import type { I18nLocale } from "@/lib/i18n/config";
import { getServerSyncMessages } from "@/lib/i18n/sync-messages";

export type LocaleBreadcrumbSpec = {
  labelKey: string;
  path: string;
  /** Used when the i18n key is missing from the bundle. */
  fallback?: string;
};

/** Resolve breadcrumb labels for JSON-LD from i18n keys (SSR-safe). */
export function resolveLocaleBreadcrumbItems(
  locale: I18nLocale | undefined,
  items: LocaleBreadcrumbSpec[]
): BreadcrumbJsonLdItem[] {
  const messages = getServerSyncMessages(locale);

  return items.map((item) => {
    const translated = t(messages, item.labelKey, item.labelKey);
    const name =
      translated !== item.labelKey ? translated : (item.fallback ?? item.labelKey);

    return { name, path: item.path };
  });
}
