import type { LocaleCode } from "@/types/locale";
import {
  DEFAULT_I18N_LOCALE,
  isI18nLocale,
  isPrefixedI18nLocale,
  type I18nLocale,
  type PrefixedI18nLocale,
} from "./config";

/** Detect locale from pathname prefix (/es/, /en/). Russian has no prefix. */
export function getLocaleFromPathname(pathname: string): I18nLocale | null {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first && isPrefixedI18nLocale(first)) {
    return first;
  }
  return null;
}

/** Strip optional /es/ or /en/ prefix; keeps Russian paths unchanged. */
export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isPrefixedI18nLocale(segments[0])) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

/** Build public path with locale prefix for es/en; Russian stays unprefixed. */
export function addLocalePrefix(pathname: string, locale: LocaleCode): string {
  const clean = stripLocalePrefix(pathname);
  if (!isPrefixedI18nLocale(locale)) {
    return clean;
  }
  if (clean === "/") {
    return `/${locale}`;
  }
  return `/${locale}${clean}`;
}

export function resolveLocaleFromRequest(
  pathname: string,
  cookieLocale?: string | null
): I18nLocale {
  const fromPath = getLocaleFromPathname(pathname);
  if (fromPath) return fromPath;
  if (cookieLocale && isI18nLocale(cookieLocale)) return cookieLocale;
  return DEFAULT_I18N_LOCALE;
}

export function isLocalePrefixedPath(pathname: string): boolean {
  return getLocaleFromPathname(pathname) !== null;
}

export function prefixedLocaleSegment(locale: PrefixedI18nLocale): string {
  return locale;
}
