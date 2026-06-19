import type { Metadata } from "next";
import ImmigrationHubView from "@/components/immigration/ImmigrationHubView";
import { IMMIGRATION_HUB } from "@/data/immigration-hub-content";

export const metadata: Metadata = {
  title: "Иммиграция в Аргентину — ВНЖ, гражданство, RADEX",
  description:
    "Полный справочник по иммиграции: 15 оснований ВНЖ, путь к гражданству, DNU 366/2025, RADEX, документы и FAQ. Справочно, без юридических гарантий.",
  openGraph: {
    title: IMMIGRATION_HUB.heroTitle,
    description: IMMIGRATION_HUB.heroSubtitle,
  },
};

export default function ImmigrationPage() {
  return <ImmigrationHubView />;
}
