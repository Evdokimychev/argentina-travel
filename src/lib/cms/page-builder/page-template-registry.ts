import type { LucideIcon } from "lucide-react";
import {
  Compass,
  FileBadge2,
  LayoutTemplate,
  MapPinned,
  BookOpenText,
} from "lucide-react";
import {
  createPageBuilderPattern,
  type PageBuilderPatternSlug,
} from "@/lib/cms/page-builder/pattern-registry";
import type { BlogBodyBlock, BlogSectionKind } from "@/types/blog-content-blocks";

/** Multi-section page packs — import fills the whole document (WTE Pattern Engine pages). */
export type PageBuilderPageTemplateSlug =
  | "landing-hub-page"
  | "destination-page"
  | "practical-guide-page"
  | "immigration-page"
  | "tour-story-page";

export type PageBuilderPageTemplateSection = {
  title: string;
  blockType?: BlogSectionKind;
  blocks: BlogBodyBlock[];
};

export type PageBuilderPageTemplateDefinition = {
  slug: PageBuilderPageTemplateSlug;
  label: string;
  description: string;
  /** Which CMS doc types this pack fits best. */
  docTypes: Array<"landing" | "destination" | "guide" | "place" | "blog" | "knowledge">;
  tags: string[];
  icon: LucideIcon;
  create: () => PageBuilderPageTemplateSection[];
};

function sectionFromPattern(
  title: string,
  patternSlug: PageBuilderPatternSlug,
  blockType?: BlogSectionKind,
): PageBuilderPageTemplateSection {
  return {
    title,
    blockType,
    blocks: createPageBuilderPattern(patternSlug),
  };
}

/**
 * Full-page starters built from existing section patterns — adapts the Design Library
 * to real site page shapes without inventing a parallel layout system.
 */
export const PAGE_BUILDER_PAGE_TEMPLATES: PageBuilderPageTemplateDefinition[] = [
  {
    slug: "landing-hub-page",
    label: "Лендинг-хаб",
    description: "Hero, быстрые переходы и блок доверия — как у хабов сайта",
    docTypes: ["landing", "guide"],
    tags: ["landing", "хаб", "cta", "лендинг"],
    icon: LayoutTemplate,
    create: () => [
      sectionFromPattern("Введение", "hub-intro"),
      sectionFromPattern("Отзывы и доверие", "reviews-social-proof"),
    ],
  },
  {
    slug: "destination-page",
    label: "Страница направления",
    description: "Тело destination: hero, факты, совет и связанные материалы",
    docTypes: ["destination", "landing"],
    tags: ["направление", "destination", "регион"],
    icon: MapPinned,
    create: () => [
      sectionFromPattern("О направлении", "destination-page-body"),
      sectionFromPattern("История места", "destination-story"),
    ],
  },
  {
    slug: "practical-guide-page",
    label: "Практический путеводитель",
    description: "Советы, чек-лист и FAQ — привычный формат гидов на сайте",
    docTypes: ["guide", "blog", "knowledge", "landing"],
    tags: ["путеводитель", "практика", "faq"],
    icon: BookOpenText,
    create: () => [
      sectionFromPattern("С чего начать", "practical-guide", "tips"),
      sectionFromPattern("Маршрут по дням", "day-by-day-route"),
    ],
  },
  {
    slug: "immigration-page",
    label: "Иммиграционная страница",
    description: "Предупреждение, сценарии и источники — под раздел иммиграции",
    docTypes: ["guide", "landing", "knowledge"],
    tags: ["иммиграция", "dni", "внж", "документы"],
    icon: FileBadge2,
    create: () => [
      sectionFromPattern("Главное", "immigration-practical", "tips"),
      sectionFromPattern("Частые вопросы", "practical-guide", "faq"),
    ],
  },
  {
    slug: "tour-story-page",
    label: "Страница о туре",
    description: "Введение к маршруту и программа — для лендингов туров",
    docTypes: ["landing", "blog", "guide"],
    tags: ["тур", "маршрут", "программа", "бронирование"],
    icon: Compass,
    create: () => [
      sectionFromPattern("О путешествии", "tour-intro"),
      sectionFromPattern("Программа", "day-by-day-route"),
      sectionFromPattern("Отзывы", "reviews-social-proof"),
    ],
  },
];

export function createPageBuilderPageTemplate(
  slug: PageBuilderPageTemplateSlug,
): PageBuilderPageTemplateSection[] {
  return PAGE_BUILDER_PAGE_TEMPLATES.find((item) => item.slug === slug)?.create() ?? [];
}

export function pageTemplatesForDocType(
  docType: PageBuilderPageTemplateDefinition["docTypes"][number],
): PageBuilderPageTemplateDefinition[] {
  return PAGE_BUILDER_PAGE_TEMPLATES.filter((template) => template.docTypes.includes(docType));
}
