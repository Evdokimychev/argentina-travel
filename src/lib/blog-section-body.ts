import { extractFaqFromBody } from "@/lib/blog-faq";
import type {
  BlogBodyBlock,
  BlogCalloutVariant,
  BlogChecklistItem,
  BlogSectionKind,
} from "@/types/blog-content-blocks";

const CALLOUT_MARKDOWN = /^>\s*\[!(\w+)\]\s*(.*)$/i;
const CALLOUT_BOLD =
  /^\*\*(Совет|Важно|Лайфхак|Что нужно знать|Ошибка туристов|Внимание|Бюджет|Сезон)[.:]?\*\*\s*(.*)$/iu;

const CALLOUT_VARIANT_MAP: Record<string, BlogCalloutVariant> = {
  tip: "tip",
  совет: "tip",
  important: "important",
  важно: "important",
  hack: "hack",
  лайфхак: "hack",
  know: "know",
  warning: "warning",
  внимание: "warning",
  mistake: "mistake",
};

const CALLOUT_LABELS: Record<BlogCalloutVariant, string> = {
  important: "Важно",
  tip: "Совет",
  hack: "Лайфхак",
  know: "Что нужно знать",
  mistake: "Ошибка туристов",
  warning: "Внимание",
};

const BULLET_LINE = /^[*\-•]\s+(.+)$/;
const CHECKLIST_LINE = /^([□☐])\s+(.+)$/;
const NEGATIVE_LINE = /^❌\s+(.+)$/;
const STEP_LINE = /^(\d+)\.\s+(.+)$/;
const SUBHEADING_MAX = 72;

export function getBlogSectionKind(
  title: string,
  blockType?: BlogSectionKind,
): BlogSectionKind {
  if (blockType) return blockType;

  const t = title.trim().toLowerCase();
  if (t === "faq" || t.includes("часто задаваемые") || t === "частые вопросы") return "faq";
  if (t.includes("типичные ошибки") || t.includes("ошибки туристов")) return "mistakes";
  if (
    t.includes("что взять") ||
    t.includes("чек-лист") ||
    t.includes("чеклист") ||
    t.includes("список вещей")
  ) {
    return "checklist";
  }
  if (
    t.includes("совет") ||
    t.includes("рекомендац") ||
    t.includes("лайфхак") ||
    t.includes("практическ")
  ) {
    return "tips";
  }
  return "default";
}

function splitRawBlocks(body: string): string[] {
  return body
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function isTableBlock(block: string): boolean {
  const lines = block.split("\n").filter(Boolean);
  if (lines.length < 2) return false;
  const tabbed = lines.filter((line) => line.includes("\t"));
  return tabbed.length >= 2 && tabbed.length === lines.length;
}

function parseTableBlock(block: string): BlogBodyBlock {
  const lines = block.split("\n").filter(Boolean);
  const rows = lines.map((line) => line.split("\t").map((cell) => cell.trim()));
  const [headers, ...dataRows] = rows;
  return { type: "table", headers: headers ?? [], rows: dataRows };
}

function parseCalloutBlock(block: string): BlogBodyBlock | null {
  if (block.startsWith(">")) {
    const lines = block.split("\n");
    const headerMatch = lines[0].match(CALLOUT_MARKDOWN);
    if (headerMatch) {
      const variant = CALLOUT_VARIANT_MAP[headerMatch[1].toLowerCase()] ?? "tip";
      const titlePart = headerMatch[2].trim();
      const bodyPart = lines.slice(1).join("\n").trim();
      if (bodyPart) {
        return {
          type: "callout",
          variant,
          title: titlePart || CALLOUT_LABELS[variant],
          body: bodyPart,
        };
      }
      if (titlePart) {
        return {
          type: "callout",
          variant,
          title: CALLOUT_LABELS[variant],
          body: titlePart,
        };
      }
    }
  }

  const mdMatch = block.match(CALLOUT_MARKDOWN);
  if (mdMatch) {
    const variant = CALLOUT_VARIANT_MAP[mdMatch[1].toLowerCase()] ?? "tip";
    const rest = mdMatch[2].trim();
    const nl = rest.indexOf("\n");
    if (nl === -1) {
      return { type: "callout", variant, title: CALLOUT_LABELS[variant], body: rest };
    }
    return {
      type: "callout",
      variant,
      title: rest.slice(0, nl).trim() || CALLOUT_LABELS[variant],
      body: rest.slice(nl + 1).trim(),
    };
  }

  const boldMatch = block.match(CALLOUT_BOLD);
  if (boldMatch) {
    const label = boldMatch[1].toLowerCase();
    let variant: BlogCalloutVariant = "tip";
    if (label.includes("важно")) variant = "important";
    else if (label.includes("лайфхак")) variant = "hack";
    else if (label.includes("бюджет") || label.includes("сезон") || label.includes("что нужно")) {
      variant = "know";
    } else if (label.includes("ошибка")) variant = "mistake";
    else if (label.includes("внимание")) variant = "warning";

    return {
      type: "callout",
      variant,
      title: boldMatch[1],
      body: boldMatch[2].trim(),
    };
  }

  return null;
}

function parseListLines(block: string): BlogBodyBlock | null {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const bullets = lines.map((line) => line.match(BULLET_LINE)?.[1]).filter(Boolean) as string[];
  if (bullets.length === lines.length) {
    return { type: "bullets", items: bullets };
  }

  const steps = lines.map((line) => line.match(STEP_LINE)?.[2]).filter(Boolean) as string[];
  if (steps.length === lines.length) {
    return { type: "steps", items: steps };
  }

  const checklist: BlogChecklistItem[] = [];
  for (const line of lines) {
    const negative = line.match(NEGATIVE_LINE);
    if (negative) {
      checklist.push({ text: negative[1], negative: true });
      continue;
    }
    const check = line.match(CHECKLIST_LINE);
    if (check) {
      checklist.push({ text: check[2] });
      continue;
    }
    return null;
  }
  if (checklist.length > 0) {
    return { type: "checklist", items: checklist };
  }

  return null;
}

function isChecklistLine(block: string): BlogChecklistItem | null {
  const line = block.trim();
  const negative = line.match(NEGATIVE_LINE);
  if (negative) return { text: negative[1], negative: true };
  const check = line.match(CHECKLIST_LINE);
  if (check) return { text: check[2] };
  return null;
}

function isSubheadingBlock(block: string): boolean {
  if (block.includes("\n")) return false;
  if (block.length > SUBHEADING_MAX) return false;
  if (/[.!?]$/.test(block)) return false;
  if (BULLET_LINE.test(block) || CHECKLIST_LINE.test(block) || NEGATIVE_LINE.test(block)) {
    return false;
  }
  if (STEP_LINE.test(block)) return false;
  return true;
}

function parseMistakesBlocks(rawBlocks: string[]): BlogBodyBlock[] {
  const result: BlogBodyBlock[] = [];
  let i = 0;

  while (i < rawBlocks.length) {
    const title = rawBlocks[i];
    const explanation = rawBlocks[i + 1];

    if (
      explanation &&
      isSubheadingBlock(title) &&
      !isChecklistLine(title) &&
      !parseCalloutBlock(title) &&
      !isTableBlock(title)
    ) {
      result.push({
        type: "callout",
        variant: "mistake",
        title,
        body: explanation,
      });
      i += 2;
      continue;
    }

    const parsed = parseSingleBlock(title);
    result.push(parsed);
    i += 1;
  }

  return result;
}

function parseSingleBlock(block: string): BlogBodyBlock {
  const callout = parseCalloutBlock(block);
  if (callout) return callout;

  if (isTableBlock(block)) return parseTableBlock(block);

  const list = parseListLines(block);
  if (list) return list;

  const singleCheck = isChecklistLine(block);
  if (singleCheck) {
    return { type: "checklist", items: [singleCheck] };
  }

  if (isSubheadingBlock(block)) {
    return { type: "subheading", text: block };
  }

  return { type: "paragraph", text: block.replace(/\n/g, " ") };
}

function mergeAdjacentBlocks(blocks: BlogBodyBlock[]): BlogBodyBlock[] {
  const merged: BlogBodyBlock[] = [];

  for (const block of blocks) {
    const prev = merged[merged.length - 1];

    if (
      block.type === "checklist" &&
      prev?.type === "checklist"
    ) {
      prev.items.push(...block.items);
      continue;
    }

    if (block.type === "bullets" && prev?.type === "bullets") {
      prev.items.push(...block.items);
      continue;
    }

    if (block.type === "steps" && prev?.type === "steps") {
      prev.items.push(...block.items);
      continue;
    }

    merged.push(block);
  }

  return merged;
}

/** Parses section body text into structured content blocks. */
export function parseBlogSectionBody(
  body: string,
  sectionTitle?: string,
  blockType?: BlogSectionKind,
): BlogBodyBlock[] {
  const kind = sectionTitle
    ? getBlogSectionKind(sectionTitle, blockType)
    : blockType ?? "default";
  const rawBlocks = splitRawBlocks(body);

  if (kind === "faq") {
    const items = extractFaqFromBody(body);
    if (items.length > 0) {
      return [{ type: "faq", items }];
    }
  }

  if (kind === "mistakes") {
    return mergeAdjacentBlocks(parseMistakesBlocks(rawBlocks));
  }

  const parsed = rawBlocks.map(parseSingleBlock);
  return mergeAdjacentBlocks(parsed);
}

export { CALLOUT_LABELS };
