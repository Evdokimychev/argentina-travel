import { cookies } from "next/headers";
import {
  DEFAULT_I18N_LOCALE,
  isI18nLocale,
  LOCALE_COOKIE_KEY,
  type I18nLocale,
} from "@/lib/i18n/config";

/** Resolve visitor locale from middleware cookie (set on /es/, /en/ prefix). */
export async function getServerI18nLocale(): Promise<I18nLocale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE_KEY)?.value;
  if (value && isI18nLocale(value)) return value;
  return DEFAULT_I18N_LOCALE;
}
