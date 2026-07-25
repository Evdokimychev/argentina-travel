import type { BlogBodyBlock } from "@/types/blog-content-blocks";

/** Pilot S11: data-only typed blocks keyed by post slug → section title */
const TYPED_BLOCKS_BY_SLUG: Record<string, Record<string, BlogBodyBlock[]>> = {
  "el-chalten-i-fitts-roy": {
    "Как выбрать маршрут": [
      {
        type: "media",
        src: "/media/blog/el-chalten-i-fitts-roy/section-1.jpg",
        alt: "Массив Фицрой над горной лагуной рядом с Эль-Чальтеном",
        caption:
          "Длинный маршрут выбирают не только по виду: заранее сопоставьте дистанцию, сложность и доступное светлое время.",
      },
    ],
    "Лагуна-де-лос-Трес: главный маршрут к Фицрою": [
      {
        type: "media",
        src: "/media/blog/el-chalten-i-fitts-roy/section-2.jpg",
        alt: "Лагуна-де-лос-Трес и горный массив Фицрой в Патагонии",
        caption:
          "Лагуна-де-лос-Трес — цель самого востребованного однодневного маршрута северной зоны Лос-Гласьярес.",
      },
    ],
    "Карта троп и мест вокруг Эль-Чальтена": [
      {
        type: "map",
        lat: -49.3325,
        lng: -72.8865,
        label: "Эль-Чальтен и тропы к Фицрою",
      },
      {
        type: "cta",
        label: "Открыть Эль-Чальтен на карте Аргентины",
        href: "/mapa-argentina?q=%D0%AD%D0%BB%D1%8C-%D0%A7%D0%B0%D0%BB%D1%8C%D1%82%D0%B5%D0%BD",
        variant: "secondary",
      },
    ],
  },
};

export function getTypedBlocksForSection(
  postSlug: string,
  sectionTitle: string,
): BlogBodyBlock[] | undefined {
  const byTitle = TYPED_BLOCKS_BY_SLUG[postSlug];
  if (!byTitle) return undefined;
  return byTitle[sectionTitle];
}
