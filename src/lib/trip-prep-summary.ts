import {
  TRIP_PREP_CATEGORY_LABELS,
  type TripPrepCategory,
  type TripPrepCategoryGroup,
  type TripPrepItemView,
  type TripPrepSummary,
} from "@/types/trip-prep";

export function buildSummary(items: TripPrepItemView[]): TripPrepSummary {
  const total = items.length;
  const checked = items.filter((item) => item.checked).length;
  const requiredItems = items.filter((item) => item.required);
  const requiredTotal = requiredItems.length;
  const requiredChecked = requiredItems.filter((item) => item.checked).length;
  const percent = total > 0 ? Math.round((checked / total) * 100) : 0;

  return {
    total,
    checked,
    requiredTotal,
    requiredChecked,
    percent,
    isComplete: requiredTotal > 0 ? requiredChecked >= requiredTotal : checked >= total,
  };
}

export function groupItemsByCategory(items: TripPrepItemView[]): TripPrepCategoryGroup[] {
  const order: TripPrepCategory[] = [
    "documents",
    "connectivity",
    "money",
    "health",
    "luggage",
    "transfer",
    "organizer",
  ];
  const grouped = new Map<TripPrepCategory, TripPrepItemView[]>();

  for (const item of items) {
    const list = grouped.get(item.category) ?? [];
    list.push(item);
    grouped.set(item.category, list);
  }

  return order
    .filter((category) => grouped.has(category))
    .map((category) => ({
      category,
      label: TRIP_PREP_CATEGORY_LABELS[category],
      items: grouped.get(category) ?? [],
    }));
}
