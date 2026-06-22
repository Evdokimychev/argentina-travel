import type { Metadata } from "next";
import ImmigrationHubView from "@/components/immigration/ImmigrationHubView";
import { IMMIGRATION_HUB } from "@/data/immigration-hub-content";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getImmigrationHubHeroImage } from "@/lib/media-resolver";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    title: "Иммиграция в Аргентину — ВНЖ, гражданство, RADEX",
    description:
      "Полный справочник по иммиграции: 15 оснований ВНЖ, путь к гражданству, Decreto 366/2025, RADEX, документы и FAQ. Справочно, без юридических гарантий.",
    path: "/immigration",
    image: getImmigrationHubHeroImage(),
  }),
  alternates: buildHreflangAlternates("/immigration"),
  openGraph: {
    title: IMMIGRATION_HUB.heroTitle,
    description: IMMIGRATION_HUB.heroSubtitle,
  },
};

export default function ImmigrationPage() {
  return <ImmigrationHubView />;
}
