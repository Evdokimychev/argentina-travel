import type {
  BlogBodyBlock,
  BlogCalloutVariant,
  BlogPhotoVariant,
  BlogSectionKind,
} from "@/types/blog-content-blocks";

const PHOTO_VARIANTS: BlogPhotoVariant[] = [
  "full-width",
  "content-width",
  "wide",
  "portrait",
  "landscape",
  "float-left",
  "float-right",
  "framed",
  "edge-to-edge",
  "editorial-split",
  "with-quote",
  "with-facts",
];
import { PAGE_BUILDER_BLOCK_BY_SLUG } from "@/lib/cms/page-builder/block-registry";

const SECTION_KINDS: BlogSectionKind[] = ["default", "faq", "mistakes", "checklist"];
const CALLOUT_VARIANTS: BlogCalloutVariant[] = [
  "important",
  "tip",
  "hack",
  "know",
  "mistake",
  "warning",
];

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeCalloutVariant(value: unknown): BlogCalloutVariant {
  if (typeof value === "string" && CALLOUT_VARIANTS.includes(value as BlogCalloutVariant)) {
    return value as BlogCalloutVariant;
  }
  return "tip";
}

export function normalizeSectionKind(value: unknown): BlogSectionKind | undefined {
  if (typeof value === "string" && SECTION_KINDS.includes(value as BlogSectionKind)) {
    return value as BlogSectionKind;
  }
  return undefined;
}

/** Coerce unknown JSON to a valid BlogBodyBlock or null. */
export function normalizeBlogBodyBlock(value: unknown): BlogBodyBlock | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const type = record.type;
  if (typeof type !== "string" || !(type in PAGE_BUILDER_BLOCK_BY_SLUG)) return null;

  switch (type) {
    case "paragraph":
      return {
        type: "paragraph",
        text: asString(record.text),
        html: asString(record.html) || undefined,
      };
    case "subheading":
      return { type: "subheading", text: asString(record.text) };
    case "bullets":
    case "steps":
      return { type, items: asStringArray(record.items).length ? asStringArray(record.items) : [""] };
    case "divider":
      return { type: "divider" };
    case "callout":
      return {
        type: "callout",
        variant: normalizeCalloutVariant(record.variant),
        title: asString(record.title, "Заголовок"),
        body: asString(record.body),
      };
    case "checklist":
      return {
        type: "checklist",
        items: Array.isArray(record.items)
          ? record.items
              .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
              .map((item) => ({
                text: asString(item.text),
                negative: item.negative === true,
              }))
          : [{ text: "" }],
      };
    case "faq":
      return {
        type: "faq",
        items: Array.isArray(record.items)
          ? record.items
              .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
              .map((item) => ({
                question: asString(item.question),
                answer: asString(item.answer),
              }))
          : [{ question: "", answer: "" }],
      };
    case "table":
      return {
        type: "table",
        headers: asStringArray(record.headers).length
          ? asStringArray(record.headers)
          : ["Колонка 1"],
        rows: Array.isArray(record.rows)
          ? record.rows
              .filter((row): row is unknown[] => Array.isArray(row))
              .map((row) => row.map((cell) => asString(cell)))
          : [[""]],
        caption: asString(record.caption) || undefined,
      };
    case "map":
      return {
        type: "map",
        lat: asNumber(record.lat, -34.6037),
        lng: asNumber(record.lng, -58.3816),
        label: asString(record.label, "Место"),
      };
    case "ticket-link":
      return {
        type: "ticket-link",
        url: asString(record.url),
        label: asString(record.label, "Подробнее"),
      };
    case "seasons":
      return {
        type: "seasons",
        items: Array.isArray(record.items)
          ? record.items
              .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
              .map((item) => ({
                name: asString(item.name, "Сезон"),
                pros: asStringArray(item.pros),
                cons: asStringArray(item.cons),
              }))
          : [],
        conclusion: asString(record.conclusion) || undefined,
      };
    case "budget":
      return {
        type: "budget",
        items: Array.isArray(record.items)
          ? record.items
              .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
              .map((item) => ({
                label: asString(item.label),
                value: asString(item.value),
              }))
          : [],
        note: asString(record.note) || undefined,
      };
    case "media":
      return {
        type: "media",
        src: asString(record.src),
        alt: asString(record.alt),
        caption: asString(record.caption) || undefined,
      };
    case "image-text":
      return {
        type: "image-text",
        src: asString(record.src),
        alt: asString(record.alt),
        title: asString(record.title, "Заголовок истории"),
        body: asString(record.body),
        imagePosition: record.imagePosition === "right" ? "right" : "left",
        caption: asString(record.caption) || undefined,
      };
    case "author-card":
      return {
        type: "author-card",
        name: asString(record.name, "Имя автора"),
        role: asString(record.role) || undefined,
        bio: asString(record.bio),
        avatarSrc: asString(record.avatarSrc) || undefined,
        avatarAlt: asString(record.avatarAlt) || undefined,
        href: asString(record.href) || undefined,
        linkLabel: asString(record.linkLabel) || undefined,
      };
    case "facts-grid":
      return {
        type: "facts-grid",
        title: asString(record.title) || undefined,
        items: Array.isArray(record.items)
          ? record.items
              .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
              .map((item) => ({
                label: asString(item.label),
                value: asString(item.value),
                description: asString(item.description) || undefined,
              }))
          : [],
        columns:
          record.columns === 2 || record.columns === 4 ? record.columns : 3,
      };
    case "quote":
      return {
        type: "quote",
        text: asString(record.text),
        author: asString(record.author) || undefined,
        context: asString(record.context) || undefined,
      };
    case "infobox":
      return {
        type: "infobox",
        variant:
          record.variant === "important" || record.variant === "warning"
            ? record.variant
            : "tip",
        title: asString(record.title, "Совет"),
        body: asString(record.body),
      };
    case "accordion":
      return {
        type: "accordion",
        items: Array.isArray(record.items)
          ? record.items
              .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
              .map((item) => ({
                title: asString(item.title),
                body: asString(item.body),
              }))
          : [{ title: "", body: "" }],
      };
    case "comparison-table":
      return {
        type: "comparison-table",
        headers: asStringArray(record.headers).length
          ? asStringArray(record.headers)
          : ["Колонка 1"],
        rows: Array.isArray(record.rows)
          ? record.rows
              .filter((row): row is unknown[] => Array.isArray(row))
              .map((row) => row.map((cell) => asString(cell)))
          : [[""]],
        highlightColumn:
          typeof record.highlightColumn === "number" ? record.highlightColumn : undefined,
        caption: asString(record.caption) || undefined,
        mobileLayout:
          record.mobileLayout === "cards" ||
          record.mobileLayout === "stacked" ||
          record.mobileLayout === "tabs" ||
          record.mobileLayout === "scroll"
            ? record.mobileLayout
            : undefined,
      };
    case "cta":
      return {
        type: "cta",
        label: asString(record.label, "Подробнее"),
        href: asString(record.href, "/contacts"),
        variant:
          record.variant === "secondary" || record.variant === "outline"
            ? record.variant
            : "primary",
      };
    case "tour-booking":
      return {
        type: "tour-booking",
        tourSlug: asString(record.tourSlug),
        label: asString(record.label) || undefined,
        showPrice: record.showPrice !== false,
      };
    case "route-map":
      return {
        type: "route-map",
        points: Array.isArray(record.points)
          ? record.points
              .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
              .map((item) => ({
                lat: asNumber(item.lat, -34.6037),
                lng: asNumber(item.lng, -58.3816),
                label: asString(item.label, "Точка"),
              }))
          : [],
        caption: asString(record.caption) || undefined,
      };
    case "gallery":
      return {
        type: "gallery",
        items: Array.isArray(record.items)
          ? record.items
              .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
              .map((item) => ({
                src: asString(item.src),
                alt: asString(item.alt),
                caption: asString(item.caption) || undefined,
              }))
          : [{ src: "", alt: "" }],
        columns:
          record.columns === 2 || record.columns === 4 ? record.columns : 3,
        variant:
          record.variant === "carousel" ||
          record.variant === "filmstrip" ||
          record.variant === "comparison" ||
          record.variant === "location"
            ? record.variant
            : record.variant === "grid"
              ? "grid"
              : undefined,
      };
    case "video":
      return {
        type: "video",
        provider: record.provider === "vimeo" ? "vimeo" : "youtube",
        videoId: asString(record.videoId),
        title: asString(record.title) || undefined,
        caption: asString(record.caption) || undefined,
      };
    case "content-embed":
      return {
        type: "content-embed",
        embedKind:
          record.embedKind === "excursion" ||
          record.embedKind === "article" ||
          record.embedKind === "guide"
            ? record.embedKind
            : "tour",
        slug: asString(record.slug),
        title: asString(record.title) || undefined,
      };
    case "widget":
      return {
        type: "widget",
        widgetKey: asString(record.widgetKey),
        title: asString(record.title) || undefined,
        config:
          record.config && typeof record.config === "object" && !Array.isArray(record.config)
            ? Object.fromEntries(
                Object.entries(record.config as Record<string, unknown>).map(([k, v]) => [
                  k,
                  asString(v),
                ])
              )
            : undefined,
      };
    case "lead":
      return {
        type: "lead",
        text: asString(record.text),
        variant:
          record.variant === "wide" ||
          record.variant === "compact" ||
          record.variant === "with-icon" ||
          record.variant === "with-author-note"
            ? record.variant
            : "default",
      };
    case "photo":
      return {
        type: "photo",
        src: asString(record.src),
        alt: asString(record.alt),
        caption: asString(record.caption) || undefined,
        author: asString(record.author) || undefined,
        sourceUrl: asString(record.sourceUrl) || undefined,
        license: asString(record.license) || undefined,
        width: typeof record.width === "number" ? record.width : undefined,
        height: typeof record.height === "number" ? record.height : undefined,
        priority: record.priority === true,
        variant:
          typeof record.variant === "string" &&
          PHOTO_VARIANTS.includes(record.variant as BlogPhotoVariant)
            ? (record.variant as BlogPhotoVariant)
            : "content-width",
      };
    case "article-summary":
      return {
        type: "article-summary",
        title: asString(record.title) || undefined,
        variant:
          record.variant === "horizontal-deck" ||
          record.variant === "checklist" ||
          record.variant === "key-facts" ||
          record.variant === "quick-answer" ||
          record.variant === "step-by-step" ||
          record.variant === "timeline-summary"
            ? record.variant
            : "cards",
        items: Array.isArray(record.items)
          ? record.items
              .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
              .map((item) => ({
                title: asString(item.title),
                body: asString(item.body),
                href: asString(item.href) || undefined,
              }))
          : [],
      };
    case "sources":
      return {
        type: "sources",
        title: asString(record.title) || undefined,
        variant:
          record.variant === "compact" || record.variant === "expandable"
            ? record.variant
            : "grouped",
        items: Array.isArray(record.items)
          ? record.items
              .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
              .map((item) => ({
                title: asString(item.title),
                url: asString(item.url),
                publisher: asString(item.publisher) || undefined,
                accessedAt: asString(item.accessedAt) || undefined,
                language: asString(item.language) || undefined,
                type:
                  item.type === "legal" ||
                  item.type === "primary-data" ||
                  item.type === "ru-context" ||
                  item.type === "personal" ||
                  item.type === "updates"
                    ? item.type
                    : "official",
                notes: asString(item.notes) || undefined,
              }))
          : [],
      };
    case "country-tip":
      return {
        type: "country-tip",
        variant:
          record.variant === "different-practice" ||
          record.variant === "living-in-argentina" ||
          record.variant === "scouting-trip"
            ? record.variant
            : "ru-traveler",
        title: asString(record.title) || undefined,
        body: asString(record.body),
      };
    case "phrasebook":
      return {
        type: "phrasebook",
        title: asString(record.title) || undefined,
        category: asString(record.category) || undefined,
        items: Array.isArray(record.items)
          ? record.items
              .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
              .map((item) => ({
                original: asString(item.original),
                translation: asString(item.translation),
                pronunciation: asString(item.pronunciation) || undefined,
                context: asString(item.context) || undefined,
              }))
          : [],
      };
    case "option-selector":
      return {
        type: "option-selector",
        title: asString(record.title) || undefined,
        description: asString(record.description) || undefined,
        options: Array.isArray(record.options)
          ? record.options
              .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
              .map((item) => ({
                id: asString(item.id) || asString(item.title).toLowerCase().replace(/\s+/g, "-"),
                title: asString(item.title),
                summary: asString(item.summary),
                details: asString(item.details) || undefined,
                meta: asString(item.meta) || undefined,
              }))
          : [],
      };
    case "pros-cons":
      return {
        type: "pros-cons",
        title: asString(record.title) || undefined,
        pros: {
          title: asString((record.pros as Record<string, unknown> | undefined)?.title) || undefined,
          items: asStringArray((record.pros as Record<string, unknown> | undefined)?.items),
        },
        cons: {
          title: asString((record.cons as Record<string, unknown> | undefined)?.title) || undefined,
          items: asStringArray((record.cons as Record<string, unknown> | undefined)?.items),
        },
        recommendation: asString(record.recommendation) || undefined,
      };
    default:
      return null;
  }
}

export function normalizeBlogBodyBlocks(value: unknown): BlogBodyBlock[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeBlogBodyBlock(item))
    .filter((block): block is BlogBodyBlock => block !== null);
}

export function parseCmsBlogSection(value: unknown): {
  title: string;
  body: string;
  blockType?: BlogSectionKind;
  blocks?: BlogBodyBlock[];
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { title: "", body: "" };
  }
  const record = value as Record<string, unknown>;
  const blocks = normalizeBlogBodyBlocks(record.blocks);
  return {
    title: asString(record.title),
    body: asString(record.body),
    blockType: normalizeSectionKind(record.blockType),
    blocks: blocks.length > 0 ? blocks : undefined,
  };
}

export function parseCmsGuideSection(value: unknown): {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
  html?: string;
  blockType?: BlogSectionKind;
  blocks?: BlogBodyBlock[];
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const record = value as Record<string, unknown>;
  const blocks = normalizeBlogBodyBlocks(record.blocks);
  const heading = asString(record.heading);
  const html = asString(record.html);
  const paragraphs = Array.isArray(record.paragraphs)
    ? record.paragraphs.filter((item): item is string => typeof item === "string")
    : undefined;
  const list = Array.isArray(record.list)
    ? record.list.filter((item): item is string => typeof item === "string")
    : undefined;

  return {
    heading: heading || undefined,
    html: html || undefined,
    paragraphs: paragraphs?.length ? paragraphs : undefined,
    list: list?.length ? list : undefined,
    blockType: normalizeSectionKind(record.blockType),
    blocks: blocks.length > 0 ? blocks : undefined,
  };
}

/** When blocks exist, derive plain body for search/fallback from paragraph blocks. */
export function blocksToPlainText(blocks: BlogBodyBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "paragraph":
        case "subheading":
          return block.text;
        case "bullets":
        case "steps":
          return block.items.join("\n");
        case "callout":
          return `${block.title}\n${block.body}`;
        case "image-text":
          return `${block.title}\n${block.body}`;
        case "author-card":
          return [block.name, block.role, block.bio].filter(Boolean).join("\n");
        case "facts-grid":
          return [
            block.title,
            ...block.items.map((item) =>
              [item.label, item.value, item.description].filter(Boolean).join(": ")
            ),
          ]
            .filter(Boolean)
            .join("\n");
        case "quote":
          return [block.text, block.author, block.context].filter(Boolean).join("\n");
        case "faq":
          return block.items.map((i) => `${i.question}\n${i.answer}`).join("\n\n");
        case "lead":
          return block.text;
        case "photo":
          return [block.alt, block.caption].filter(Boolean).join("\n");
        case "article-summary":
          return [
            block.title,
            ...block.items.map((item) => `${item.title}\n${item.body}`),
          ]
            .filter(Boolean)
            .join("\n");
        case "sources":
          return block.items.map((item) => `${item.title} ${item.url}`).join("\n");
        case "country-tip":
          return [block.title, block.body].filter(Boolean).join("\n");
        case "phrasebook":
          return block.items
            .map((item) => `${item.original} — ${item.translation}`)
            .join("\n");
        case "option-selector":
          return [
            block.title,
            ...block.options.map((item) => `${item.title}\n${item.summary}`),
          ]
            .filter(Boolean)
            .join("\n");
        case "pros-cons":
          return [
            block.title,
            ...block.pros.items,
            ...block.cons.items,
            block.recommendation,
          ]
            .filter(Boolean)
            .join("\n");
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

export function sectionHasBuilderContent(section: {
  body: string;
  blocks?: BlogBodyBlock[];
}): boolean {
  return (section.blocks?.length ?? 0) > 0 || section.body.trim().length > 0;
}
