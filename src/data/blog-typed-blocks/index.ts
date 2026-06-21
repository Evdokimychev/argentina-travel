import type { BlogBodyBlock } from "@/types/blog-content-blocks";

/** Pilot S11: data-only typed blocks keyed by post slug → section title */
const TYPED_BLOCKS_BY_SLUG: Record<string, Record<string, BlogBodyBlock[]>> = {
  "best-time-to-visit-argentina": {
    "Лето (декабрь – февраль)": [
      {
        type: "seasons",
        items: [
          {
            name: "Лето (декабрь – февраль)",
            pros: [
              "Лучшее время для Патагонии",
              "Открыты все треккинговые маршруты",
              "Максимально длинный световой день",
            ],
            cons: [
              "Высокие цены и много туристов",
              "Сильная жара на севере страны",
            ],
          },
        ],
      },
    ],
    "Когда дешевле всего путешествовать": [
      {
        type: "budget",
        items: [
          { label: "Май", value: "Низкий сезон, выгодные отели" },
          { label: "Июнь", value: "Низкий сезон, горнолыжные курорты" },
          { label: "Август", value: "Низкий сезон, кроме зимних каникул" },
          { label: "Сентябрь", value: "Межсезонье, баланс цены и погоды" },
        ],
        note: "Исключение — зимние каникулы в июле: цены на курорты растут.",
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
