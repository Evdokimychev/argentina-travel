import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  Building2,
  CalendarDays,
  Compass,
  FileBadge2,
  LayoutTemplate,
  MapPinned,
  MountainSnow,
  Pin,
  Star,
  UserRound,
  Waves,
  Wine,
} from "lucide-react";
import type { BlogBodyBlock } from "@/types/blog-content-blocks";
import { PAGE_BUILDER_BLOCK_BY_SLUG } from "@/lib/cms/page-builder/block-registry";

export type PageBuilderPatternSlug =
  | "destination-story"
  | "practical-guide"
  | "expert-story"
  | "tour-intro"
  | "iguazu-waterfalls"
  | "patagonia-glaciers"
  | "buenos-aires-city-guide"
  | "wine-and-food"
  | "day-by-day-route"
  | "destination-page-body"
  | "place-practical"
  | "immigration-practical"
  | "hub-intro"
  | "reviews-social-proof";

export type PageBuilderPatternCategory =
  | "story"
  | "practical"
  | "tour"
  | "page"
  | "social";

export const PAGE_BUILDER_PATTERN_CATEGORIES: Record<
  PageBuilderPatternCategory,
  { label: string; description: string }
> = {
  story: {
    label: "Истории",
    description: "Атмосферные материалы и направления",
  },
  practical: {
    label: "Практика",
    description: "Советы, чек-листы, иммиграция",
  },
  tour: {
    label: "Туры",
    description: "Введение к маршруту и программа",
  },
  page: {
    label: "Страницы",
    description: "Шаблоны направлений, хабов и лендингов",
  },
  social: {
    label: "Доверие",
    description: "Отзывы и социальное доказательство",
  },
};

export type PageBuilderPatternDefinition = {
  slug: PageBuilderPatternSlug;
  label: string;
  description: string;
  tags: string[];
  category: PageBuilderPatternCategory;
  icon: LucideIcon;
  create: () => BlogBodyBlock[];
};

/**
 * Opinionated block compositions, similar to WordPress Patterns / Elementor Kits.
 * Each call returns fresh blocks so one insertion can never mutate another.
 */
export const PAGE_BUILDER_PATTERNS: PageBuilderPatternDefinition[] = [
  {
    slug: "destination-story",
    label: "История направления",
    description: "Крупное фото, краткие факты и атмосферная цитата",
    tags: ["направление", "фото", "факты", "регион"],
    category: "story",
    icon: MapPinned,
    create: () => [
      {
        type: "image-text",
        src: "",
        alt: "",
        title: "Почему стоит увидеть это место",
        body: "Расскажите, чем направление отличается от других и какое впечатление оставляет.",
        imagePosition: "left",
      },
      {
        type: "facts-grid",
        title: "Коротко о главном",
        columns: 3,
        items: [
          { label: "Лучшее время", value: "Укажите сезон" },
          { label: "Сколько дней", value: "Укажите срок" },
          { label: "Подходит для", value: "Укажите формат" },
        ],
      },
      { type: "quote", text: "Добавьте наблюдение путешественника или местного эксперта." },
    ],
  },
  {
    slug: "practical-guide",
    label: "Практический путеводитель",
    description: "Совет редакции, контрольный список и частые вопросы",
    tags: ["путеводитель", "советы", "чек-лист", "faq"],
    category: "practical",
    icon: BookOpenText,
    create: () => [
      { type: "callout", variant: "tip", title: "Совет редакции", body: "Добавьте главный практический совет." },
      { type: "checklist", items: [{ text: "Первый пункт подготовки" }, { text: "Второй пункт подготовки" }] },
      { type: "faq", items: [{ question: "Частый вопрос путешественника", answer: "Короткий и полезный ответ." }] },
    ],
  },
  {
    slug: "expert-story",
    label: "Материал с автором",
    description: "Карточка эксперта, личная цитата и фотогалерея",
    tags: ["автор", "эксперт", "цитата", "галерея"],
    category: "story",
    icon: UserRound,
    create: () => [
      { type: "author-card", name: "Имя автора", role: "Автор материала", bio: "Расскажите об опыте автора и его связи с Аргентиной." },
      { type: "quote", text: "Добавьте личное наблюдение или короткий вывод автора." },
      { type: "gallery", items: [{ src: "", alt: "" }, { src: "", alt: "" }], columns: 2 },
    ],
  },
  {
    slug: "tour-intro",
    label: "Введение к туру",
    description: "Фотоистория, параметры путешествия и переход к бронированию",
    tags: ["тур", "маршрут", "бронирование", "программа"],
    category: "tour",
    icon: Compass,
    create: () => [
      { type: "image-text", src: "", alt: "", title: "О путешествии", body: "Опишите характер маршрута и главное впечатление.", imagePosition: "right" },
      {
        type: "facts-grid",
        title: "Формат поездки",
        columns: 3,
        items: [
          { label: "Продолжительность", value: "Укажите дни" },
          { label: "Группа", value: "Укажите размер" },
          { label: "Темп", value: "Укажите сложность" },
        ],
      },
      { type: "tour-booking", tourSlug: "", label: "Посмотреть тур", showPrice: true },
    ],
  },
  {
    slug: "iguazu-waterfalls",
    label: "Водопады Игуасу",
    description: "Эмоциональное вступление, план посещения, советы и фотогалерея",
    tags: ["игуасу", "водопад", "водопады", "миссионес", "природа", "тропы", "национальный парк"],
    category: "story",
    icon: Waves,
    create: () => [
      {
        type: "image-text",
        src: "",
        alt: "",
        title: "Игуасу: знакомство с водопадами",
        body: "Опишите первое впечатление от водопадов и объясните, для кого подойдёт поездка.",
        imagePosition: "left",
      },
      {
        type: "facts-grid",
        title: "Как спланировать посещение",
        columns: 3,
        items: [
          { label: "Сколько времени", value: "Укажите продолжительность" },
          { label: "Когда приезжать", value: "Укажите подходящий период" },
          { label: "Что взять", value: "Добавьте главное" },
        ],
      },
      {
        type: "callout",
        variant: "tip",
        title: "Совет перед прогулкой",
        body: "Добавьте проверенную рекомендацию о маршруте, погоде или экипировке.",
      },
      {
        type: "gallery",
        columns: 3,
        items: [
          { src: "", alt: "" },
          { src: "", alt: "" },
          { src: "", alt: "" },
        ],
      },
    ],
  },
  {
    slug: "patagonia-glaciers",
    label: "Ледники Патагонии",
    description: "Фотоистория, сезонность, подготовка и галерея ледников",
    tags: ["ледник", "ледники", "патагония", "перито-морено", "эль-калафате", "природа", "сезоны"],
    category: "story",
    icon: MountainSnow,
    create: () => [
      {
        type: "image-text",
        src: "",
        alt: "",
        title: "Путешествие к ледникам",
        body: "Расскажите о характере поездки, природном ландшафте и главном впечатлении маршрута.",
        imagePosition: "right",
      },
      {
        type: "seasons",
        items: [
          {
            name: "Основной сезон",
            pros: ["Добавьте преимущество периода"],
            cons: ["Добавьте ограничение периода"],
          },
          {
            name: "Межсезонье",
            pros: ["Добавьте преимущество периода"],
            cons: ["Добавьте ограничение периода"],
          },
        ],
        conclusion: "Уточните погодные условия и доступность маршрутов перед поездкой.",
      },
      {
        type: "checklist",
        items: [
          { text: "Проверить прогноз и статус маршрута" },
          { text: "Подготовить одежду для переменчивой погоды" },
          { text: "Уточнить правила посещения природной территории" },
        ],
      },
      {
        type: "gallery",
        columns: 2,
        items: [
          { src: "", alt: "" },
          { src: "", alt: "" },
        ],
      },
    ],
  },
  {
    slug: "buenos-aires-city-guide",
    label: "Городской путеводитель",
    description: "Районы, прогулка по шагам, точка на карте и местный совет",
    tags: ["буэнос-айрес", "город", "городской путеводитель", "районы", "прогулка", "достопримечательности"],
    category: "practical",
    icon: Building2,
    create: () => [
      {
        type: "image-text",
        src: "",
        alt: "",
        title: "Как почувствовать город",
        body: "Объясните характер города, его ритм и с какого района удобно начать знакомство.",
        imagePosition: "left",
      },
      {
        type: "facts-grid",
        title: "Коротко о прогулке",
        columns: 3,
        items: [
          { label: "Продолжительность", value: "Укажите время" },
          { label: "Темп", value: "Укажите формат" },
          { label: "Лучший старт", value: "Укажите район" },
        ],
      },
      {
        type: "steps",
        items: [
          "Начните с первого района и добавьте ориентир",
          "Продолжите прогулку через ключевую городскую точку",
          "Завершите маршрут местом для отдыха или ужина",
        ],
      },
      { type: "map", lat: -34.6037, lng: -58.3816, label: "Буэнос-Айрес" },
      {
        type: "callout",
        variant: "know",
        title: "Полезно знать",
        body: "Добавьте актуальный местный совет о транспорте, безопасности или времени работы.",
      },
    ],
  },
  {
    slug: "wine-and-food",
    label: "Вино и гастрономия",
    description: "Введение, форматы дегустации, гастрономический список и фотографии",
    tags: ["вино", "винный", "гастрономия", "еда", "рестораны", "мендоса", "дегустация"],
    category: "story",
    icon: Wine,
    create: () => [
      {
        type: "image-text",
        src: "",
        alt: "",
        title: "Вкус региона",
        body: "Расскажите о местной гастрономии, винной культуре и особенностях выбранного направления.",
        imagePosition: "right",
      },
      {
        type: "comparison-table",
        headers: ["Формат", "Для кого", "Сколько времени"],
        rows: [
          ["Короткая дегустация", "Опишите аудиторию", "Укажите длительность"],
          ["Гастрономический день", "Опишите аудиторию", "Укажите длительность"],
        ],
        caption: "Сравнение форматов — замените примеры на проверенные предложения.",
      },
      {
        type: "checklist",
        items: [
          { text: "Уточнить формат и продолжительность посещения" },
          { text: "Проверить необходимость предварительной записи" },
          { text: "Сообщить организатору о пищевых ограничениях" },
        ],
      },
      {
        type: "gallery",
        columns: 3,
        items: [
          { src: "", alt: "" },
          { src: "", alt: "" },
          { src: "", alt: "" },
        ],
      },
    ],
  },
  {
    slug: "day-by-day-route",
    label: "Маршрут по дням",
    description: "Параметры поездки, программа по дням, карта и запасной план",
    tags: ["маршрут", "по дням", "программа", "день", "план поездки", "карта", "итинерарий"],
    category: "tour",
    icon: CalendarDays,
    create: () => [
      {
        type: "facts-grid",
        title: "Параметры маршрута",
        columns: 3,
        items: [
          { label: "Продолжительность", value: "Укажите количество дней" },
          { label: "Точка старта", value: "Укажите место" },
          { label: "Формат", value: "Самостоятельно или с гидом" },
        ],
      },
      {
        type: "steps",
        items: [
          "День 1. Добавьте прибытие, главные места и время на отдых",
          "День 2. Добавьте основную программу и логистику",
          "День 3. Добавьте заключительную часть и дальнейший переезд",
        ],
      },
      {
        type: "route-map",
        points: [
          { lat: -34.6037, lng: -58.3816, label: "Замените на начало маршрута" },
        ],
        caption: "Замените точки на фактический маршрут поездки.",
      },
      {
        type: "callout",
        variant: "tip",
        title: "Запасной план",
        body: "Добавьте альтернативу на случай погоды, задержки транспорта или закрытия объекта.",
      },
    ],
  },
  {
    slug: "destination-page-body",
    label: "Тело страницы направления",
    description: "Hero, факты, советы, карта и CTA для destination",
    tags: ["направление", "destination", "hero", "страница", "регион"],
    category: "page",
    icon: LayoutTemplate,
    create: () => [
      {
        type: "hero-banner",
        eyebrow: "Направление",
        title: "Название региона",
        lede: "Коротко объясните, чем направление интересно и для кого подходит.",
        primaryCta: { label: "Смотреть туры", href: "/tours" },
        secondaryCta: { label: "Открыть карту", href: "/mapa-argentina" },
      },
      {
        type: "facts-grid",
        title: "Коротко о направлении",
        columns: 3,
        items: [
          { label: "Когда ехать", value: "Укажите сезон" },
          { label: "Сколько дней", value: "Укажите срок" },
          { label: "База", value: "Укажите город" },
        ],
      },
      { type: "callout", variant: "tip", title: "Совет", body: "Добавьте практический совет по логистике или сезону." },
      { type: "map", lat: -34.6037, lng: -58.3816, label: "Точка направления" },
      {
        type: "hub-cta-row",
        title: "Что дальше",
        items: [
          { label: "Места региона", href: "/places", description: "Справочник объектов" },
          { label: "Путеводители", href: "/guide", description: "Практические гиды" },
        ],
      },
    ],
  },
  {
    slug: "place-practical",
    label: "Практическая карточка места",
    description: "Как добраться, чек-лист, FAQ и источники",
    tags: ["место", "place", "практика", "как добраться", "faq"],
    category: "practical",
    icon: Pin,
    create: () => [
      {
        type: "image-text",
        src: "",
        alt: "",
        title: "Зачем сюда ехать",
        body: "Опишите характер места и главное впечатление посетителя.",
        imagePosition: "left",
      },
      {
        type: "steps",
        items: [
          "Как добраться из ближайшего хаба",
          "Сколько закладывать времени на визит",
          "Что проверить перед выездом",
        ],
      },
      {
        type: "checklist",
        items: [
          { text: "Проверить часы работы и тариф" },
          { text: "Уточнить погоду и доступность маршрута" },
          { text: "Сохранить офлайн-карту" },
        ],
      },
      {
        type: "faq",
        items: [
          { question: "Нужен ли билет заранее?", answer: "Уточните актуальные правила на официальной странице." },
        ],
      },
      {
        type: "sources",
        title: "Источники",
        items: [{ title: "Официальный источник", url: "https://www.argentina.gob.ar/", type: "official" }],
      },
    ],
  },
  {
    slug: "immigration-practical",
    label: "Иммиграционный практический блок",
    description: "Предупреждение, шаги, документы, источники",
    tags: ["иммиграция", "документы", "dni", "внж", "residencia", "правовой"],
    category: "practical",
    icon: FileBadge2,
    create: () => [
      {
        type: "callout",
        variant: "warning",
        title: "Важно",
        body: "Правила меняются. Перед подачей сверяйтесь с официальными страницами Migraciones.",
      },
      {
        type: "option-selector",
        title: "Какой сценарий у вас",
        options: [
          { id: "tourist", title: "Турист", summary: "Краткий въезд без оформления residencia." },
          { id: "temporary", title: "Временная residencia", summary: "Оформление статуса и дальнейших trámites." },
          { id: "permanent", title: "Постоянная", summary: "Долгий статус — проверьте категорию и пакет документов." },
        ],
      },
      {
        type: "steps",
        items: [
          "Проверить актуальный статус пребывания",
          "Собрать пакет документов по своей категории",
          "Подать заявление и отслеживать сроки",
        ],
      },
      {
        type: "checklist",
        items: [
          { text: "Паспорт и копии" },
          { text: "Подтверждение адреса / certificado" },
          { text: "Актуальные требования Migraciones" },
        ],
      },
      {
        type: "sources",
        items: [
          {
            title: "Migraciones",
            url: "https://www.argentina.gob.ar/interior/migraciones",
            type: "official",
          },
        ],
      },
    ],
  },
  {
    slug: "hub-intro",
    label: "Введение хаба",
    description: "Hero, факты и ряд CTA для хабов и лендингов",
    tags: ["хаб", "landing", "hero", "cta", "навигация"],
    category: "page",
    icon: LayoutTemplate,
    create: () => [
      {
        type: "hero-banner",
        eyebrow: "Раздел",
        title: "Заголовок хаба",
        lede: "Объясните, какие материалы и сервисы найдёт читатель в этом разделе.",
        primaryCta: { label: "Начать", href: "/" },
      },
      {
        type: "facts-grid",
        title: "Что внутри",
        columns: 3,
        items: [
          { label: "Статьи", value: "Практические гиды" },
          { label: "Карта", value: "Регионы и места" },
          { label: "Сервисы", value: "Туры и экскурсии" },
        ],
      },
      {
        type: "hub-cta-row",
        title: "Быстрые переходы",
        items: [
          { label: "Путеводители", href: "/guide", description: "Структурированные гиды" },
          { label: "Блог", href: "/blog", description: "Редакционные материалы" },
          { label: "Карта", href: "/mapa-argentina", description: "Интерактивная карта" },
        ],
      },
      {
        type: "related-links",
        title: "Популярные материалы",
        items: [
          { label: "Когда лучше ехать", href: "/blog/best-time-to-visit-argentina" },
          { label: "DNI и CUIL", href: "/blog/dni-cuil-argentina" },
        ],
      },
    ],
  },
  {
    slug: "reviews-social-proof",
    label: "Отзывы и доверие",
    description: "Сводка оценок, цитаты путешественников и призыв оставить отзыв",
    tags: ["отзывы", "рейтинг", "social proof", "доверие", "оценки", "цитаты"],
    category: "social",
    icon: Star,
    create: () => [
      {
        type: "facts-grid",
        title: "Оценки путешественников",
        columns: 3,
        items: [
          { label: "Средняя оценка", value: "4.9" },
          { label: "Отзывов", value: "128" },
          { label: "Рекомендуют", value: "96%" },
        ],
      },
      {
        type: "quote",
        text: "Добавьте короткий отзыв о маршруте, гиде или главном впечатлении.",
      },
      {
        type: "quote",
        text: "Второй отзыв — о логистике, комфорте или том, что запомнилось сильнее всего.",
      },
      {
        type: "cta",
        label: "Оставить отзыв",
        href: "#reviews",
      },
    ],
  },
];

function normalizePatternSearchValue(value: string): string {
  return value.trim().toLocaleLowerCase("ru").replaceAll("ё", "е");
}

export function matchesPageBuilderPattern(pattern: PageBuilderPatternDefinition, query: string): boolean {
  const normalizedQuery = normalizePatternSearchValue(query);
  if (!normalizedQuery) return true;

  const categoryLabel = PAGE_BUILDER_PATTERN_CATEGORIES[pattern.category].label;
  return normalizePatternSearchValue(
    [pattern.label, pattern.description, categoryLabel, ...pattern.tags].join(" "),
  ).includes(normalizedQuery);
}

/** Unique block labels for Design Library preview chips (order preserved). */
export function getPageBuilderPatternPreviewChips(
  pattern: PageBuilderPatternDefinition,
  limit = 4,
): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const block of pattern.create()) {
    const label = PAGE_BUILDER_BLOCK_BY_SLUG[block.type]?.label ?? block.type;
    if (seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
    if (labels.length >= limit) break;
  }
  return labels;
}

export function createPageBuilderPattern(slug: PageBuilderPatternSlug): BlogBodyBlock[] {
  return PAGE_BUILDER_PATTERNS.find((pattern) => pattern.slug === slug)?.create() ?? [];
}
