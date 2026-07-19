import type { BlogPost, BlogPostSection } from "@/types";
import { cleanLegacyBlogSourceMarkers } from "@/lib/blog-editorial-cleanup";

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
  const title = section.title.trim().toLowerCase();
  return (
    title === "faq" ||
    title === "часто задаваемые вопросы" ||
    title === "частые вопросы"
  );
}

/** Parses FAQ pairs from section body text («Вопрос? Ответ.») */
export function extractFaqFromBody(body: string): BlogFaqItem[] {
  if (!body.trim()) return [];

  const text = cleanLegacyBlogSourceMarkers(body).replace(/\s+/g, " ");
  const questionEnds = Array.from(text.matchAll(/\?/g), (match) => match.index);
  if (questionEnds.length === 0) return [];

  const questionStarts = questionEnds.map((questionEnd, index) => {
    if (index === 0) return 0;

    const previousQuestionEnd = questionEnds[index - 1];
    const between = text.slice(previousQuestionEnd + 1, questionEnd);
    const sentenceBoundaries = Array.from(between.matchAll(/[.!]\s+/g));
    const lastBoundary = sentenceBoundaries.at(-1);

    return lastBoundary?.index == null
      ? previousQuestionEnd + 1
      : previousQuestionEnd + 1 + lastBoundary.index + lastBoundary[0].length;
  });

  return questionEnds.flatMap((questionEnd, index) => {
    const questionStart = questionStarts[index];
    const answerEnd = questionStarts[index + 1] ?? text.length;
    const question = text
      .slice(questionStart, questionEnd + 1)
      .replace(/^(?:\([^)]{2,80}\)\s*)+/, "")
      .trim();
    const answer = text.slice(questionEnd + 1, answerEnd).trim();

    return question && answer ? [{ question, answer }] : [];
  });
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
