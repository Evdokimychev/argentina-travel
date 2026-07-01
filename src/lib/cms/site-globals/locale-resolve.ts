import { DEFAULT_I18N_LOCALE, type I18nLocale } from "@/lib/i18n/config";
import type { SiteGlobalLocaleOverrides } from "@/types/site-globals";

type LocaleOverrideKey = keyof SiteGlobalLocaleOverrides<unknown>;

/**
 * Merge CMS global base (RU) with optional en/es overrides.
 * Fallback chain: requested locale override → base (ru) fields.
 */
export function resolveSiteGlobalForLocale<T extends Record<string, unknown>>(
  base: T,
  locales: SiteGlobalLocaleOverrides<Partial<T>> | undefined,
  locale: I18nLocale = DEFAULT_I18N_LOCALE,
): T {
  if (locale === DEFAULT_I18N_LOCALE || !locales) {
    return base;
  }

  const override = locales[locale as LocaleOverrideKey];
  if (!override) {
    return base;
  }

  return { ...base, ...override };
}
