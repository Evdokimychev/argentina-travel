/**
 * Native tour detail layout slots (WTE-inspired).
 * Order and ids must stay in sync with TourDetailView / section nav anchors.
 * Partner tours use a separate branch and are intentionally out of scope.
 */

export const NATIVE_TOUR_LAYOUT_SLOT_IDS = [
  "stats",
  "description",
  "places",
  "related-places",
  "itinerary",
  "dates",
  "group-trips",
  "included",
  "accommodations",
  "packing",
  "policies",
  "important",
  "flight-logistics",
  "logistics",
  "route-map",
  "faq",
  "organizer",
  "leave-review",
  "reviews",
  "similar",
] as const;

export type NativeTourLayoutSlotId = (typeof NATIVE_TOUR_LAYOUT_SLOT_IDS)[number];

/** Default single-trip column order — matches legacy TourDetailView hardcode. */
export const NATIVE_TOUR_LAYOUT_DEFAULT_ORDER: readonly NativeTourLayoutSlotId[] =
  NATIVE_TOUR_LAYOUT_SLOT_IDS;

export type NativeTourLayoutSlotMeta = {
  id: NativeTourLayoutSlotId;
  /** Human label for future CMS layout editor (nav may use different labels). */
  label: string;
  /** DOM anchor when the section renders with this id. */
  anchorId?: string;
};

export const NATIVE_TOUR_LAYOUT_SLOT_META: Record<
  NativeTourLayoutSlotId,
  NativeTourLayoutSlotMeta
> = {
  stats: { id: "stats", label: "Параметры тура" },
  description: { id: "description", label: "Описание", anchorId: "description" },
  places: { id: "places", label: "Впечатления", anchorId: "places" },
  "related-places": {
    id: "related-places",
    label: "Связанные места",
    anchorId: "related-places",
  },
  itinerary: { id: "itinerary", label: "Программа", anchorId: "itinerary" },
  dates: { id: "dates", label: "Даты", anchorId: "dates" },
  "group-trips": {
    id: "group-trips",
    label: "Попутчики",
    anchorId: "group-trips",
  },
  included: { id: "included", label: "Что включено", anchorId: "included" },
  accommodations: {
    id: "accommodations",
    label: "Проживание",
    anchorId: "accommodations",
  },
  packing: { id: "packing", label: "Что взять", anchorId: "packing" },
  policies: { id: "policies", label: "Условия", anchorId: "policies" },
  important: { id: "important", label: "Важно", anchorId: "important" },
  "flight-logistics": { id: "flight-logistics", label: "Авиалогистика" },
  logistics: { id: "logistics", label: "Логистика", anchorId: "logistics" },
  "route-map": { id: "route-map", label: "Карта маршрута", anchorId: "route-map" },
  faq: { id: "faq", label: "FAQ", anchorId: "faq" },
  organizer: { id: "organizer", label: "Организатор", anchorId: "organizer" },
  "leave-review": { id: "leave-review", label: "Оставить отзыв", anchorId: "leave-review" },
  reviews: { id: "reviews", label: "Отзывы", anchorId: "reviews" },
  similar: { id: "similar", label: "Похожие туры", anchorId: "similar" },
};

/**
 * Resolve render order. Unknown ids are dropped; missing slots fall back to default order.
 * Ready for future CMS override without changing TourDetailView again.
 */
export function resolveNativeTourLayoutOrder(
  override?: readonly string[] | null,
): NativeTourLayoutSlotId[] {
  if (!override?.length) {
    return [...NATIVE_TOUR_LAYOUT_DEFAULT_ORDER];
  }

  const allowed = new Set<string>(NATIVE_TOUR_LAYOUT_SLOT_IDS);
  const seen = new Set<NativeTourLayoutSlotId>();
  const ordered: NativeTourLayoutSlotId[] = [];

  for (const raw of override) {
    if (!allowed.has(raw)) continue;
    const id = raw as NativeTourLayoutSlotId;
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
  }

  for (const id of NATIVE_TOUR_LAYOUT_DEFAULT_ORDER) {
    if (seen.has(id)) continue;
    ordered.push(id);
  }

  return ordered;
}
