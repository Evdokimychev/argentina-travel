import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  CalendarRange,
  CircleDollarSign,
  CircleHelp,
  Globe2,
  HelpCircle,
  ImageIcon,
  Images,
  LayoutGrid,
  LayoutTemplate,
  Library,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  MapPin,
  Megaphone,
  Minus,
  PanelBottom,
  PanelsTopLeft,
  Route,
  Scale,
  ShoppingBag,
  Sparkles,
  Table2,
  Ticket,
  Type,
  Sun,
  Video,
  Workflow,
} from "lucide-react";
import type {
  BlogBodyBlock,
  BlogCalloutVariant,
  BlogSectionKind,
} from "@/types/blog-content-blocks";

export type PageBuilderBlockSlug = BlogBodyBlock["type"];

export type PageBuilderBlockGroup =
  | "content"
  | "components"
  | "travel"
  | "media"
  | "commerce"
  | "embeds";

export type PageBuilderBlockDefinition = {
  slug: PageBuilderBlockSlug;
  label: string;
  description: string;
  group: PageBuilderBlockGroup;
  icon: LucideIcon;
  /** Suggested section blockType when adding this block */
  suggestedSectionKind?: BlogSectionKind;
  create: () => BlogBodyBlock;
};

const CALLOUT_VARIANTS: BlogCalloutVariant[] = [
  "important",
  "tip",
  "hack",
  "know",
  "mistake",
  "warning",
];

export const PAGE_BUILDER_BLOCK_GROUPS: Record<
  PageBuilderBlockGroup,
  { label: string; description: string }
> = {
  content: { label: "Текст", description: "Абзацы, списки, шаги" },
  components: { label: "Компоненты", description: "Callout, FAQ, таблицы" },
  travel: { label: "Путешествия", description: "Карты, сезоны, бюджет" },
  media: { label: "Медиа", description: "Изображения, галереи, видео" },
  commerce: { label: "Бронирование", description: "CTA и туры" },
  embeds: { label: "Встраивания", description: "Статьи, экскурсии, виджеты" },
};

/** Registry aligned with Payload blocks field pattern (slug → config → component). */
export const PAGE_BUILDER_BLOCKS: PageBuilderBlockDefinition[] = [
  {
    slug: "paragraph",
    label: "Абзац",
    description: "Обычный текстовый блок",
    group: "content",
    icon: Type,
    create: () => ({ type: "paragraph", text: "" }),
  },
  {
    slug: "subheading",
    label: "Подзаголовок",
    description: "H3 внутри раздела",
    group: "content",
    icon: Type,
    create: () => ({ type: "subheading", text: "" }),
  },
  {
    slug: "bullets",
    label: "Маркированный список",
    description: "Пункты с буллетами",
    group: "content",
    icon: List,
    create: () => ({ type: "bullets", items: [""] }),
  },
  {
    slug: "steps",
    label: "Нумерованные шаги",
    description: "Пошаговая инструкция",
    group: "content",
    icon: ListOrdered,
    create: () => ({ type: "steps", items: [""] }),
  },
  {
    slug: "divider",
    label: "Разделитель",
    description: "Горизонтальная линия",
    group: "content",
    icon: Minus,
    create: () => ({ type: "divider" }),
  },
  {
    slug: "callout",
    label: "Выноска",
    description: "Совет, предупреждение, ошибка",
    group: "components",
    icon: Megaphone,
    create: () => ({
      type: "callout",
      variant: "tip",
      title: "Заголовок",
      body: "",
    }),
  },
  {
    slug: "checklist",
    label: "Чек-лист",
    description: "Список с галочками",
    group: "components",
    icon: ListChecks,
    suggestedSectionKind: "checklist",
    create: () => ({ type: "checklist", items: [{ text: "" }] }),
  },
  {
    slug: "faq",
    label: "FAQ",
    description: "Вопросы и ответы",
    group: "components",
    icon: HelpCircle,
    suggestedSectionKind: "faq",
    create: () => ({ type: "faq", items: [{ question: "", answer: "" }] }),
  },
  {
    slug: "infobox",
    label: "Инфобокс",
    description: "Важно / Совет / Предупреждение",
    group: "components",
    icon: Megaphone,
    create: () => ({
      type: "infobox",
      variant: "tip",
      title: "Совет",
      body: "",
    }),
  },
  {
    slug: "accordion",
    label: "Аккордеон",
    description: "Сворачиваемые блоки",
    group: "components",
    icon: PanelBottom,
    create: () => ({
      type: "accordion",
      items: [{ title: "Заголовок", body: "" }],
    }),
  },
  {
    slug: "comparison-table",
    label: "Сравнительная таблица",
    description: "Таблица с выделением колонки",
    group: "components",
    icon: Table2,
    create: () => ({
      type: "comparison-table",
      headers: ["Вариант A", "Вариант B"],
      rows: [["", ""]],
      highlightColumn: 0,
    }),
  },
  {
    slug: "cta",
    label: "Кнопка CTA",
    description: "Призыв к действию",
    group: "commerce",
    icon: Link2,
    create: () => ({
      type: "cta",
      label: "Подробнее",
      href: "/contacts",
      variant: "primary",
    }),
  },
  {
    slug: "tour-booking",
    label: "Бронирование тура",
    description: "CTA на страницу тура",
    group: "commerce",
    icon: ShoppingBag,
    create: () => ({
      type: "tour-booking",
      tourSlug: "",
      label: "Забронировать тур",
      showPrice: true,
    }),
  },
  {
    slug: "table",
    label: "Таблица",
    description: "Заголовки и строки",
    group: "components",
    icon: Table2,
    create: () => ({
      type: "table",
      headers: ["Колонка 1", "Колонка 2"],
      rows: [["", ""]],
    }),
  },
  {
    slug: "map",
    label: "Карта",
    description: "Точка на карте",
    group: "travel",
    icon: MapPin,
    create: () => ({
      type: "map",
      lat: -34.6037,
      lng: -58.3816,
      label: "Буэнос-Айрес",
    }),
  },
  {
    slug: "route-map",
    label: "Маршрут",
    description: "Несколько точек маршрута",
    group: "travel",
    icon: Route,
    create: () => ({
      type: "route-map",
      points: [{ lat: -34.6037, lng: -58.3816, label: "Старт" }],
    }),
  },
  {
    slug: "ticket-link",
    label: "Ссылка на билеты",
    description: "CTA на покупку билетов",
    group: "travel",
    icon: Ticket,
    create: () => ({
      type: "ticket-link",
      url: "https://www.argentina.gob.ar/parquesnacionales",
      label: "Официальные тарифы",
    }),
  },
  {
    slug: "seasons",
    label: "Сезоны",
    description: "Плюсы и минусы по сезонам",
    group: "travel",
    icon: Sun,
    create: () => ({
      type: "seasons",
      items: [{ name: "Лето", pros: [""], cons: [""] }],
    }),
  },
  {
    slug: "budget",
    label: "Бюджет",
    description: "Строки расходов",
    group: "travel",
    icon: CircleDollarSign,
    create: () => ({
      type: "budget",
      items: [{ label: "Проживание", value: "от 40 USD/ночь" }],
    }),
  },
  {
    slug: "media",
    label: "Изображение",
    description: "Фото с подписью (MediaBlock)",
    group: "media",
    icon: ImageIcon,
    create: () => ({
      type: "media",
      src: "",
      alt: "",
    }),
  },
  {
    slug: "image-text",
    label: "Фото и текст",
    description: "Редакционная карточка с фото слева или справа",
    group: "media",
    icon: ImageIcon,
    create: () => ({
      type: "image-text",
      src: "",
      alt: "",
      title: "Заголовок истории",
      body: "",
      imagePosition: "left",
    }),
  },
  {
    slug: "author-card",
    label: "Карточка автора",
    description: "Автор, эксперт или местный проводник",
    group: "components",
    icon: LayoutGrid,
    create: () => ({
      type: "author-card",
      name: "Имя автора",
      role: "Автор материала",
      bio: "",
      avatarSrc: "",
    }),
  },
  {
    slug: "facts-grid",
    label: "Коротко о главном",
    description: "Сетка ключевых фактов и показателей",
    group: "travel",
    icon: Table2,
    create: () => ({
      type: "facts-grid",
      title: "Коротко о главном",
      items: [
        { label: "Когда ехать", value: "Круглый год" },
        { label: "Сколько дней", value: "3–5 дней" },
        { label: "Формат", value: "Самостоятельно" },
      ],
      columns: 3,
    }),
  },
  {
    slug: "quote",
    label: "Цитата",
    description: "Выразительная цитата с подписью",
    group: "content",
    icon: Type,
    create: () => ({
      type: "quote",
      text: "",
      author: "",
      context: "",
    }),
  },
  {
    slug: "gallery",
    label: "Галерея",
    description: "Несколько изображений",
    group: "media",
    icon: Images,
    create: () => ({
      type: "gallery",
      items: [{ src: "", alt: "" }],
      columns: 3,
    }),
  },
  {
    slug: "video",
    label: "Видео",
    description: "YouTube или Vimeo",
    group: "media",
    icon: Video,
    create: () => ({
      type: "video",
      provider: "youtube",
      videoId: "",
      title: "",
    }),
  },
  {
    slug: "content-embed",
    label: "Вставка материала",
    description: "Тур, экскурсия или статья сайта",
    group: "embeds",
    icon: LayoutGrid,
    create: () => ({
      type: "content-embed",
      embedKind: "tour",
      slug: "",
    }),
  },
  {
    slug: "widget",
    label: "Виджет",
    description: "Встраиваемый блок (flights, map, …)",
    group: "embeds",
    icon: Workflow,
    create: () => ({
      type: "widget",
      widgetKey: "",
      title: "",
      config: {},
    }),
  },
  {
    slug: "lead",
    label: "Лид",
    description: "Короткий вводный абзац",
    group: "content",
    icon: Sparkles,
    create: () => ({
      type: "lead",
      text: "",
      variant: "default",
    }),
  },
  {
    slug: "photo",
    label: "Фотоблок",
    description: "Системное фото с вариантами ширины",
    group: "media",
    icon: ImageIcon,
    create: () => ({
      type: "photo",
      src: "",
      alt: "",
      variant: "content-width",
    }),
  },
  {
    slug: "article-summary",
    label: "Краткое содержание",
    description: "Карточки ключевых моментов",
    group: "components",
    icon: LayoutGrid,
    create: () => ({
      type: "article-summary",
      title: "Коротко о главном",
      variant: "cards",
      items: [
        { title: "Пункт 1", body: "" },
        { title: "Пункт 2", body: "" },
      ],
    }),
  },
  {
    slug: "sources",
    label: "Источники",
    description: "Список источников с датой проверки",
    group: "components",
    icon: Library,
    create: () => ({
      type: "sources",
      title: "Источники и дата проверки",
      variant: "grouped",
      items: [
        {
          title: "",
          url: "https://",
          type: "official",
        },
      ],
    }),
  },
  {
    slug: "country-tip",
    label: "Совет для русскоязычных",
    description: "Контекстный блок для русскоязычного читателя",
    group: "components",
    icon: Globe2,
    create: () => ({
      type: "country-tip",
      variant: "ru-traveler",
      body: "",
    }),
  },
  {
    slug: "phrasebook",
    label: "Разговорник",
    description: "Фразы на испанском с переводом",
    group: "components",
    icon: BookOpenText,
    create: () => ({
      type: "phrasebook",
      title: "Полезные фразы",
      items: [{ original: "", translation: "" }],
    }),
  },
  {
    slug: "option-selector",
    label: "Выбор варианта",
    description: "Селектор отрубов, регионов или документов",
    group: "components",
    icon: CircleHelp,
    create: () => ({
      type: "option-selector",
      title: "Выберите вариант",
      options: [
        { id: "a", title: "Вариант A", summary: "" },
        { id: "b", title: "Вариант B", summary: "" },
      ],
    }),
  },
  {
    slug: "pros-cons",
    label: "Плюсы и минусы",
    description: "Сравнение за и против",
    group: "components",
    icon: Scale,
    create: () => ({
      type: "pros-cons",
      title: "Плюсы и минусы",
      pros: { items: [""] },
      cons: { items: [""] },
    }),
  },
  {
    slug: "season-matrix",
    label: "Матрица сезонов",
    description: "Виджет регионов × месяцев",
    group: "travel",
    icon: CalendarRange,
    create: () => ({ type: "season-matrix" }),
  },
  {
    slug: "tourism-infographic",
    label: "Туристическая инфографика",
    description: "Обзорная инфографика по туризму",
    group: "travel",
    icon: PanelsTopLeft,
    create: () => ({ type: "tourism-infographic" }),
  },
  {
    slug: "tourism-timeline",
    label: "Таймлайн туризма",
    description: "Сезонный или исторический таймлайн",
    group: "travel",
    icon: CalendarRange,
    create: () => ({ type: "tourism-timeline" }),
  },
  {
    slug: "hero-banner",
    label: "Hero-баннер",
    description: "Крупный вводный блок с CTA для страниц и хабов",
    group: "media",
    icon: LayoutTemplate,
    create: () => ({
      type: "hero-banner",
      eyebrow: "Раздел сайта",
      title: "Заголовок страницы",
      lede: "Короткое описание ценности раздела.",
      primaryCta: { label: "Основное действие", href: "/" },
    }),
  },
  {
    slug: "related-links",
    label: "Связанные материалы",
    description: "Список внутренних ссылок",
    group: "embeds",
    icon: Link2,
    create: () => ({
      type: "related-links",
      title: "Читайте также",
      items: [
        { label: "Связанная статья", href: "/blog", description: "Краткое пояснение" },
      ],
    }),
  },
  {
    slug: "hub-cta-row",
    label: "Ряд CTA хаба",
    description: "Несколько карточек-действий для хабов и лендингов",
    group: "commerce",
    icon: LayoutGrid,
    create: () => ({
      type: "hub-cta-row",
      title: "Что дальше",
      items: [
        { label: "Смотреть туры", href: "/tours", description: "Каталог маршрутов" },
        { label: "Открыть карту", href: "/mapa-argentina", description: "Регионы и места" },
      ],
    }),
  },
];

export const PAGE_BUILDER_BLOCK_BY_SLUG = Object.fromEntries(
  PAGE_BUILDER_BLOCKS.map((b) => [b.slug, b])
) as Record<PageBuilderBlockSlug, PageBuilderBlockDefinition>;

export function createPageBuilderBlock(slug: PageBuilderBlockSlug): BlogBodyBlock {
  return PAGE_BUILDER_BLOCK_BY_SLUG[slug].create();
}

export function blockDefinitionFor(block: BlogBodyBlock): PageBuilderBlockDefinition {
  return (
    PAGE_BUILDER_BLOCK_BY_SLUG[block.type] ?? {
      slug: block.type,
      label: block.type,
      description: "Неизвестный или устаревший блок — проверьте registry",
      group: "content",
      icon: Type,
      create: () => ({ type: "paragraph", text: "" }),
    }
  );
}

export { CALLOUT_VARIANTS };
