import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  Building2,
  CalendarDays,
  Compass,
  MapPinned,
  MountainSnow,
  UserRound,
  Waves,
  Wine,
} from "lucide-react";
import type { BlogBodyBlock } from "@/types/blog-content-blocks";

export type PageBuilderPatternSlug =
  | "destination-story"
  | "practical-guide"
  | "expert-story"
  | "tour-intro"
  | "iguazu-waterfalls"
  | "patagonia-glaciers"
  | "buenos-aires-city-guide"
  | "wine-and-food"
  | "day-by-day-route";

export type PageBuilderPatternDefinition = {
  slug: PageBuilderPatternSlug;
  label: string;
  description: string;
  tags: string[];
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
];

function normalizePatternSearchValue(value: string): string {
  return value.trim().toLocaleLowerCase("ru").replaceAll("ё", "е");
}

export function matchesPageBuilderPattern(pattern: PageBuilderPatternDefinition, query: string): boolean {
  const normalizedQuery = normalizePatternSearchValue(query);
  if (!normalizedQuery) return true;

  return normalizePatternSearchValue([pattern.label, pattern.description, ...pattern.tags].join(" "))
    .includes(normalizedQuery);
}

export function createPageBuilderPattern(slug: PageBuilderPatternSlug): BlogBodyBlock[] {
  return PAGE_BUILDER_PATTERNS.find((pattern) => pattern.slug === slug)?.create() ?? [];
}
