import type { ExcursionDetail } from "@/types/excursion";

const MOVEMENT_LABELS: Record<string, string> = {
  foot: "Пешком",
  car: "На автомобиле",
  bus: "На автобусе",
  boat: "На лодке",
  bike: "На велосипеде",
  segway: "На сегвее",
  helicopter: "На вертолёте",
  horse: "Верхом",
  balloon: "На воздушном шаре",
};

export function formatMovementType(value: string | undefined, t: (key: string) => string): string | null {
  if (!value) return null;
  const key = `excursions.movement.${value}`;
  const translated = t(key);
  if (translated !== key) return translated;
  return MOVEMENT_LABELS[value] ?? value;
}

export function buildExcursionSectionLinks(excursion: ExcursionDetail) {
  const links: Array<{ id: string; labelKey: string }> = [];

  if (
    excursion.descriptionBlocks.length > 0 ||
    excursion.annotation ||
    excursion.description
  ) {
    links.push({ id: "program", labelKey: "excursions.section.program" });
  }
  if (excursion.meetingPoint || excursion.finishPoint) {
    links.push({ id: "meeting", labelKey: "excursions.section.meeting" });
  }
  if (excursion.priceIncluded || excursion.priceExcluded) {
    links.push({ id: "included", labelKey: "excursions.section.included" });
  }
  if (excursion.guide) {
    links.push({ id: "guide", labelKey: "excursions.section.guide" });
  }
  links.push({ id: "booking-conditions", labelKey: "excursions.section.bookingConditions" });
  if ((excursion.reviews?.length ?? 0) > 0) {
    links.push({ id: "reviews", labelKey: "excursions.section.reviews" });
  }
  links.push({ id: "booking", labelKey: "excursions.section.booking" });

  return links;
}
