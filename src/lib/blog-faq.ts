import type { BlogPost, BlogPostSection } from "@/types";
import { cleanLegacyBlogSourceMarkers } from "@/lib/blog-editorial-cleanup";
import { stripHeadingDecorations } from "@/lib/content-heading-id";

export type BlogFaqItem = {
  question: string;
  answer: string;
};

function faqBlocksFromSections(sections: BlogPostSection[]): BlogFaqItem[] {
  const items: BlogFaqItem[] = [];
  for (const section of sections) {
    const blocks = section.blocks ?? [];
    for (const block of blocks) {
      if (block.type === "faq") {
        items.push(...block.items);
      }
    }
  }
  return items;
}

function isFaqSection(section: BlogPostSection): boolean {
  if (section.blockType === "faq") return true;
  // Strip a leading decorative emoji (e.g. "❓ Часто задаваемые вопросы") the
  // same way the TOC/anchor logic does, so a heading accent never breaks FAQ detection.
  const title = stripHeadingDecorations(section.title).trim().toLowerCase();
  return (
    title === "faq" ||
    title === "часто задаваемые вопросы" ||
    title === "частые вопросы"
  );
}

/** Strip list markers / leftover bold wrappers from a FAQ question. */
function normalizeFaqQuestion(raw: string): string {
  return raw
    .replace(/^\*+\s*/, "")
    .replace(/\*+\s*$/, "")
    .replace(/^(?:\d+\.\s*)+/, "")
    .replace(/^(?:\([^)]{2,80}\)\s*)+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize answer text; drop leaked next-item numbers (`…пейзажами. 2.`). */
function normalizeFaqAnswer(raw: string): string {
  return raw
    .replace(/^\*+\s*/, "")
    .replace(/\s+\d+\.\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Manual-from-md FAQ format:
 * `**1. Question?**\nAnswer.\n\n**2. Next?**\nAnswer.`
 */
function extractNumberedBoldFaq(body: string): BlogFaqItem[] {
  const headerRe = /^\*\*\s*(?:\d+\.\s*)?(.+?\?)\s*\*\*\s*$/gm;
  const headers = Array.from(body.matchAll(headerRe));
  if (headers.length === 0) return [];

  return headers.flatMap((match, index) => {
    const question = normalizeFaqQuestion(match[1] ?? "");
    const answerStart = (match.index ?? 0) + match[0].length;
    const answerEnd =
      index + 1 < headers.length ? (headers[index + 1].index ?? body.length) : body.length;
    const answer = normalizeFaqAnswer(body.slice(answerStart, answerEnd));
    return question && answer ? [{ question, answer }] : [];
  });
}

/**
 * Compact plain-text FAQ («Вопрос? Ответ. Следующий? …»).
 * Sentence boundaries must ignore numbered markers (`2. Next…`).
 */
function extractCompactFaq(body: string): BlogFaqItem[] {
  const text = body.replace(/\s+/g, " ").trim();
  if (!text) return [];

  const questionEnds = Array.from(text.matchAll(/\?/g), (match) => match.index);
  if (questionEnds.length === 0) return [];

  const questionStarts = questionEnds.map((questionEnd, index) => {
    if (index === 0) return 0;

    const previousQuestionEnd = questionEnds[index - 1];
    const between = text.slice(previousQuestionEnd + 1, questionEnd);
    // Do not treat `2.` / `10.` list markers as sentence ends.
    const sentenceBoundaries = Array.from(between.matchAll(/(?<!\d)[.!](?!\d)\s+/g));
    const lastBoundary = sentenceBoundaries.at(-1);

    return lastBoundary?.index == null
      ? previousQuestionEnd + 1
      : previousQuestionEnd + 1 + lastBoundary.index + lastBoundary[0].length;
  });

  return questionEnds.flatMap((questionEnd, index) => {
    const questionStart = questionStarts[index];
    const answerEnd = questionStarts[index + 1] ?? text.length;
    const question = normalizeFaqQuestion(text.slice(questionStart, questionEnd + 1));
    const answer = normalizeFaqAnswer(text.slice(questionEnd + 1, answerEnd));

    return question && answer ? [{ question, answer }] : [];
  });
}

/** Parses FAQ pairs from section body text («Вопрос? Ответ.» or `**1. Q?**`). */
export function extractFaqFromBody(body: string): BlogFaqItem[] {
  if (!body.trim()) return [];

  const cleaned = cleanLegacyBlogSourceMarkers(body);
  const numbered = extractNumberedBoldFaq(cleaned);
  if (numbered.length > 0) return numbered;

  return extractCompactFaq(cleaned);
}

/** Извлекает пары вопрос–ответ из секции FAQ (формат «Вопрос? Ответ.») */
export function extractFaqFromBlogSections(
  sections: BlogPostSection[] | undefined,
): BlogFaqItem[] {
  if (!sections?.length) return [];

  const typedFaq = faqBlocksFromSections(sections);
  if (typedFaq.length > 0) return typedFaq;

  const faqSection = sections.find(isFaqSection);
  if (!faqSection?.body.trim()) return [];

  return extractFaqFromBody(faqSection.body);
}

export function extractFaqFromBlogPost(post: BlogPost): BlogFaqItem[] {
  return extractFaqFromBlogSections(post.sections);
}
