import type { BlogBodyBlock } from "@/types/blog-content-blocks";
import type { EditorialRhythmWarning } from "@/editorial/types";

const CARDISH = new Set([
  "gallery",
  "facts-grid",
  "article-summary",
  "image-text",
  "seasons",
  "pros-cons",
]);

const FULL_WIDTH = new Set([
  "gallery",
  "season-matrix",
  "tourism-infographic",
  "tourism-timeline",
  "route-map",
  "map",
]);

/** Warn about visual rhythm problems before publish. */
export function checkEditorialRhythm(blocks: BlogBodyBlock[]): EditorialRhythmWarning[] {
  const warnings: EditorialRhythmWarning[] = [];
  let ctaCount = 0;
  let calloutCount = 0;
  let cardRun = 0;
  const imageSrcs = new Map<string, number>();

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const prev = i > 0 ? blocks[i - 1] : undefined;

    if (block.type === "cta" || block.type === "ticket-link" || block.type === "tour-booking") {
      ctaCount += 1;
    }
    if (block.type === "callout" || block.type === "infobox" || block.type === "country-tip") {
      calloutCount += 1;
    }

    if (CARDISH.has(block.type)) {
      cardRun += 1;
      if (cardRun >= 3) {
        warnings.push({
          code: "card-run",
          message: "Три и более card/gallery блоков подряд — разбавьте текстом",
          index: i,
        });
      }
    } else {
      cardRun = 0;
    }

    if (prev && FULL_WIDTH.has(prev.type) && FULL_WIDTH.has(block.type)) {
      warnings.push({
        code: "full-width-pair",
        message: "Два full-width блока подряд перегружают ритм",
        index: i,
      });
    }

    if (block.type === "media" || block.type === "photo") {
      const count = (imageSrcs.get(block.src) ?? 0) + 1;
      imageSrcs.set(block.src, count);
      if (count === 2) {
        warnings.push({
          code: "duplicate-image",
          message: `Изображение повторяется: ${block.src}`,
          index: i,
        });
      }
    }

    if (block.type === "gallery") {
      for (const item of block.items) {
        const count = (imageSrcs.get(item.src) ?? 0) + 1;
        imageSrcs.set(item.src, count);
        if (count === 2) {
          warnings.push({
            code: "duplicate-image",
            message: `Изображение повторяется: ${item.src}`,
            index: i,
          });
        }
      }
    }
  }

  if (ctaCount > 2) {
    warnings.push({
      code: "too-many-cta",
      message: `Слишком много CTA (${ctaCount}). Оставьте один основной и максимум один дополнительный`,
    });
  }

  if (calloutCount > 8) {
    warnings.push({
      code: "too-many-callouts",
      message: `Слишком много выносок (${calloutCount}). Сократите до смысловых предупреждений`,
    });
  }

  const longTextRun = countLongTextWithoutVisual(blocks);
  if (longTextRun) {
    warnings.push(longTextRun);
  }

  return warnings;
}

function countLongTextWithoutVisual(blocks: BlogBodyBlock[]): EditorialRhythmWarning | null {
  let textChars = 0;
  let start = 0;
  const VISUAL = new Set([
    "media",
    "photo",
    "gallery",
    "map",
    "route-map",
    "facts-grid",
    "article-summary",
    "image-text",
    "video",
    "season-matrix",
  ]);

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (VISUAL.has(block.type)) {
      textChars = 0;
      start = i + 1;
      continue;
    }
    if (block.type === "paragraph") textChars += block.text.length;
    if (block.type === "lead") textChars += block.text.length;
    if (block.type === "bullets") textChars += block.items.join(" ").length;
    if (textChars > 1800) {
      return {
        code: "long-text-without-visual",
        message: "Длинный текстовый участок без визуального блока",
        index: start,
      };
    }
  }
  return null;
}
