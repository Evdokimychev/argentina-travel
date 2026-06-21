import type { LucideIcon } from "lucide-react";
import {
  CircleDollarSign,
  HelpCircle,
  ImageIcon,
  Images,
  LayoutGrid,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  MapPin,
  Megaphone,
  Minus,
  PanelBottom,
  Route,
  ShoppingBag,
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
];

export const PAGE_BUILDER_BLOCK_BY_SLUG = Object.fromEntries(
  PAGE_BUILDER_BLOCKS.map((b) => [b.slug, b])
) as Record<PageBuilderBlockSlug, PageBuilderBlockDefinition>;

export function createPageBuilderBlock(slug: PageBuilderBlockSlug): BlogBodyBlock {
  return PAGE_BUILDER_BLOCK_BY_SLUG[slug].create();
}

export function blockDefinitionFor(block: BlogBodyBlock): PageBuilderBlockDefinition {
  return PAGE_BUILDER_BLOCK_BY_SLUG[block.type];
}

export { CALLOUT_VARIANTS };
