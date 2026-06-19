import type { Metadata } from "next";
import { PREFIXED_I18N_LOCALES } from "./config";
import { addLocalePrefix, stripLocalePrefix } from "./locale-path";
import { absoluteUrl } from "@/lib/site-url";

/**
 * Build hreflang alternates for pilot locales.
 * Russian canonical stays unprefixed; es/en use /es/ and /en/ prefixes.
 */
export function buildHreflangAlternates(path: string): NonNullable<Metadata["alternates"]> {
  const cleanPath = stripLocalePrefix(path);
  const languages: Record<string, string> = {
    ru: absoluteUrl(cleanPath),
    "x-default": absoluteUrl(cleanPath),
  };

  for (const locale of PREFIXED_I18N_LOCALES) {
    languages[locale] = absoluteUrl(addLocalePrefix(cleanPath, locale));
  }

  return {
    canonical: cleanPath,
    languages,
  };
}
