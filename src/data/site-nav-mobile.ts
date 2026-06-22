import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Camera,
  Compass,
  Info,
  MapPinned,
  Newspaper,
  Plane,
  ShoppingBag,
  Sparkles,
  Wrench,
} from "lucide-react";
import { SITE_NAV_MOBILE_SECTIONS, SITE_NAV_SECTIONS } from "@/data/site-nav";
import type { SiteNavSection } from "@/types/site-nav";

/** Visual groups for the mobile drawer — every mobile section appears exactly once. */
export type SiteNavMobileGroup = {
  id: string;
  label: string;
  description: string;
  sectionIds: string[];
};

export const SITE_NAV_MOBILE_GROUPS: SiteNavMobileGroup[] = [
  {
    id: "travel",
    label: "Путешествия",
    description: "Куда ехать, чем заняться и что посмотреть",
    sectionIds: ["geography", "tours", "excursions", "gallery"],
  },
  {
    id: "guides",
    label: "Справочники",
    description: "Путеводитель, иммиграция и статьи",
    sectionIds: ["guide", "immigration", "journal"],
  },
  {
    id: "services",
    label: "Сервисы и покупки",
    description: "Полезные инструменты и магазин",
    sectionIds: ["services", "shop"],
  },
  {
    id: "platform",
    label: "О платформе",
    description: "Команда, документы и поддержка",
    sectionIds: ["about"],
  },
];

export const SITE_NAV_SECTION_ICONS: Record<string, LucideIcon> = {
  geography: MapPinned,
  tours: Compass,
  excursions: Sparkles,
  guide: BookOpen,
  gallery: Camera,
  immigration: Plane,
  shop: ShoppingBag,
  services: Wrench,
  journal: Newspaper,
  about: Info,
};

export function getSiteNavSectionIcon(sectionId: string): LucideIcon {
  return SITE_NAV_SECTION_ICONS[sectionId] ?? Compass;
}

export function buildMobileNavGroups(): Array<
  SiteNavMobileGroup & { sections: SiteNavSection[] }
> {
  const byId = new Map(SITE_NAV_SECTIONS.map((section) => [section.id, section]));

  return SITE_NAV_MOBILE_GROUPS.map((group) => ({
    ...group,
    sections: group.sectionIds
      .map((id) => byId.get(id))
      .filter((section): section is SiteNavSection => Boolean(section)),
  }));
}

/** Guard: all non-home sections must appear in a mobile group. */
export function assertMobileNavCoverage(): void {
  const grouped = new Set(SITE_NAV_MOBILE_GROUPS.flatMap((group) => group.sectionIds));
  for (const section of SITE_NAV_MOBILE_SECTIONS) {
    if (!grouped.has(section.id)) {
      throw new Error(`Mobile nav group missing section: ${section.id}`);
    }
  }
}
