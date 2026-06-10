import type { GuidePillarContent } from "@/types/guide-pillar";
import type { TravelHubTocItem } from "@/types/guide-travel-hub";

type BuildGuidePillarTocOptions = {
  hasPracticalTips?: boolean;
  hasReadMore?: boolean;
};

export function buildGuidePillarToc(
  pillar: GuidePillarContent,
  options: BuildGuidePillarTocOptions = {}
): TravelHubTocItem[] {
  const items: TravelHubTocItem[] = [{ id: "quick-30", label: "Кратко за 30 секунд" }];

  for (const section of pillar.sections) {
    items.push({ id: section.id, label: section.title });
  }

  for (const slot of pillar.widgetSlots ?? []) {
    items.push({ id: slot.id, label: slot.label });
  }

  if (options.hasPracticalTips) {
    items.push({ id: "practical-tips", label: "Практические советы" });
  }

  if (pillar.partnerServices.length > 0) {
    items.push({ id: "recommend", label: "Рекомендуем" });
  }

  if (options.hasReadMore ?? pillar.blogLinks.length > 0) {
    items.push({ id: "read-more", label: "Читайте также" });
  }

  if (pillar.faq.length > 0) {
    items.push({ id: "faq", label: "FAQ" });
  }

  return items;
}
