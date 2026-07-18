import type { Metadata } from "next";
import type { DestinationPage } from "@/data/destination-pages";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import type { I18nLocale } from "@/lib/i18n/config";
import { getServerSyncMessages } from "@/lib/i18n/sync-messages";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const TITLE_FALLBACK = "Направления и места";
const DESCRIPTION_FALLBACK =
  "7 городов и 1 макрорегион для планирования поездки, а также справочник мест Аргентины с картой, подборками и турами.";

export function buildDestinationsCatalogMetadata(locale?: I18nLocale): Metadata {
  const messages = getServerSyncMessages(locale);
  const title = messages["destinations.catalog.title"] ?? TITLE_FALLBACK;
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
): { name: string; description: string; numberOfItems: number } {
  const messages = getServerSyncMessages(locale);
  const baseTitle = messages["destinations.catalog.title"] ?? TITLE_FALLBACK;
  const baseDescription = messages["destinations.meta.description"] ?? DESCRIPTION_FALLBACK;

  return {
    name: baseTitle,
    description: baseDescription,
    numberOfItems: destinations.length,
  };
}
