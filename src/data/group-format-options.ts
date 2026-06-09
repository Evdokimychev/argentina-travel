import { GroupSizeBucket, TourFormat } from "@/types";
import { GROUP_SIZE_OPTIONS } from "@/data/filters";

/** Size buckets shown for each tour format */
export const GROUP_SIZE_FOR_FORMAT: Record<TourFormat, GroupSizeBucket[]> = {
  group: ["До 4 человек", "До 8 человек", "До 12 человек", "До 20 человек", "Более 20 человек"],
  individual: ["Индивидуально", "До 4 человек", "До 8 человек", "До 12 человек"],
};

export const GROUP_SIZE_DESCRIPTIONS: Partial<Record<GroupSizeBucket, string>> = {
  "Индивидуально": "Один человек или пара без других туристов",
  "До 4 человек": "Небольшая компания, семья или друзья",
  "До 8 человек": "Компания до восьми человек",
  "До 12 человек": "Средняя группа",
  "До 20 человек": "Большая группа",
  "Более 20 человек": "Массовые туры и экскурсии",
};

export function getAvailableGroupSizes(formats: TourFormat[]): GroupSizeBucket[] {
  if (formats.length === 0) return [...GROUP_SIZE_OPTIONS];

  const allowed = new Set<GroupSizeBucket>();
  for (const format of formats) {
    for (const size of GROUP_SIZE_FOR_FORMAT[format]) {
      allowed.add(size);
    }
  }
  return GROUP_SIZE_OPTIONS.filter((s) => allowed.has(s));
}

export function pruneGroupSizes(
  sizes: GroupSizeBucket[],
  formats: TourFormat[]
): GroupSizeBucket[] {
  const allowed = new Set(getAvailableGroupSizes(formats));
  return sizes.filter((s) => allowed.has(s));
}
