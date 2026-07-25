import type { BlogBodyBlock } from "@/types/blog-content-blocks";

/** Immigration/practical article pilot — proves the system beyond gastronomy. */
export const DNI_CUIL_TYPED_BLOCKS: Record<string, BlogBodyBlock[]> = {
  "Три разных назначения": [
    {
      type: "lead",
      text: "DNI, CUIL и CUIT решают разные задачи. Их часто путают, потому что все три встречаются в бытовых и налоговых сценариях.",
      variant: "compact",
    },
    {
      type: "option-selector",
      title: "Что вам нужно",
      options: [
        {
          id: "dni",
          title: "DNI",
          summary: "Документ, удостоверяющий личность и статус проживания.",
          details: "Для иностранца связан с residencia; не путать с налоговым номером.",
        },
        {
          id: "cuil",
          title: "CUIL",
          summary: "Идентификатор для социальных и трудовых сценариев через ANSES.",
        },
        {
          id: "cuit",
          title: "CUIT",
          summary: "Налоговый идентификатор для предпринимательства и части договоров.",
        },
      ],
    },
  ],
  "DNI для иностранца": [
    {
      type: "steps",
      items: [
        "Проверьте актуальный статус пребывания и тип residencia",
        "Соберите пакет по требованиям Migraciones на вашу дату",
        "Не ориентируйтесь на чужие сроки — они зависят от категории и загрузки",
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: "Важно",
      body: "Правила и сроки меняются. Перед подачей сверяйтесь с официальными страницами Migraciones и не полагайтесь только на пересказы в чатах.",
    },
  ],
  "Источники и дата проверки": [
    {
      type: "sources",
      variant: "grouped",
      items: [
        {
          title: "Migraciones — информация для иностранцев",
          url: "https://www.argentina.gob.ar/interior/migraciones",
          publisher: "Dirección Nacional de Migraciones",
          type: "official",
          accessedAt: "2026-07-17",
        },
      ],
    },
    {
      type: "country-tip",
      variant: "living-in-argentina",
      body: "Если вы уже живёте в стране, храните сканы DNI/trámites отдельно от телефона и обновляйте календарь сроков residencia заранее.",
    },
  ],
};
