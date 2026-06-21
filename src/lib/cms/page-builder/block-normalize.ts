import type {
  BlogBodyBlock,
  BlogCalloutVariant,
  BlogSectionKind,
} from "@/types/blog-content-blocks";
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
    case "subheading":
      return { type, text: asString(record.text) };
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
        case "faq":
          return block.items.map((i) => `${i.question}\n${i.answer}`).join("\n\n");
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
