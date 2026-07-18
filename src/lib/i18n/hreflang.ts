import type { Metadata } from "next";
import { addLocalePrefix, stripLocalePrefix } from "./locale-path";
import { absoluteUrl } from "@/lib/site-url";

/**
 * Build hreflang alternates for pilot locales.
 * Russian canonical stays unprefixed; es/en use /es/ and /en/ prefixes.
 */
export function buildHreflangAlternates(
  path: string,
  publishedLocales: ReadonlyArray<"en" | "es"> = []
): NonNullable<Metadata["alternates"]> {
  const cleanPath = stripLocalePrefix(path);
  const languages: Record<string, string> = {
    ru: absoluteUrl(cleanPath),
    "x-default": absoluteUrl(cleanPath),
  };

  for (const locale of publishedLocales) {
    languages[locale] = absoluteUrl(addLocalePrefix(cleanPath, locale));
  }

  return {
    canonical: cleanPath,
    languages,
  };
}
