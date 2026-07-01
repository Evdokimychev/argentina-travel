import type { Metadata } from "next";
import type { DestinationPage } from "@/data/destination-pages";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import type { I18nLocale } from "@/lib/i18n/config";
import { getServerSyncMessages } from "@/lib/i18n/sync-messages";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const TITLE_FALLBACK = "Регионы и места";
const DESCRIPTION_FALLBACK =
  "8 регионов для планирования поездки и справочник мест Аргентины: парки, ледники, водопады и города — с картой, подборками и турами.";

export function buildDestinationsCatalogMetadata(locale?: I18nLocale): Metadata {
  const messages = getServerSyncMessages(locale);
  const title = messages["nav.geography"] ?? TITLE_FALLBACK;
  const description = messages["destinations.meta.description"] ?? DESCRIPTION_FALLBACK;

  return {
    ...buildPublicPageMetadata({
      title,
      description,
      path: "/destinations",
      image: "/media/destinations/patagonia/cover.jpg",
    }),
    alternates: buildHreflangAlternates("/destinations"),
  };
}

export function buildDestinationsCatalogJsonLd(
  destinations: DestinationPage[],
  locale?: I18nLocale
): { name: string; description: string } {
  const messages = getServerSyncMessages(locale);
  const baseTitle = messages["nav.geography"] ?? TITLE_FALLBACK;
  const baseDescription = messages["destinations.meta.description"] ?? DESCRIPTION_FALLBACK;

  return {
    name: `${baseTitle} — ${destinations.length} регионов`,
    description: baseDescription,
  };
}
