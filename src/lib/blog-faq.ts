import type { BlogPost, BlogPostSection } from "@/types";

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

  const items: BlogFaqItem[] = [];
  const blocks = body.includes("\n\n") ? body.split(/\n\n+/) : [body];

  for (const block of blocks) {
    const qEnd = block.indexOf("?");
    if (qEnd === -1) continue;

    const question = block.slice(0, qEnd + 1).trim();
    const answer = block.slice(qEnd + 1).trim();
    if (question && answer) {
      items.push({ question, answer });
    }
  }

  if (items.length > 0) return items;

  const text = body.trim();
  let pos = 0;

  while (pos < text.length) {
    const qEnd = text.indexOf("?", pos);
    if (qEnd === -1) break;

    const slice = text.slice(pos, qEnd);
    const lastDot = slice.lastIndexOf(". ");
    const question = (lastDot >= 0 ? slice.slice(lastDot + 2) : slice).trim() + "?";

    const answerStart = qEnd + 1;
    const nextQEnd = text.indexOf("?", answerStart + 1);
    let answerEnd = nextQEnd === -1 ? text.length : nextQEnd;

    if (nextQEnd !== -1) {
      const between = text.slice(answerStart, nextQEnd);
      const lastDotBeforeQ = between.lastIndexOf(". ");
      if (lastDotBeforeQ >= 0) {
        answerEnd = answerStart + lastDotBeforeQ + 1;
      }
    }

    const answer = text.slice(answerStart, answerEnd).trim();
    if (question && answer) {
      items.push({ question, answer });
    }

    if (nextQEnd === -1) break;

    const between = text.slice(answerStart, nextQEnd);
    const lastDotBeforeQ = between.lastIndexOf(". ");
    pos = lastDotBeforeQ >= 0 ? answerStart + lastDotBeforeQ + 2 : nextQEnd;
  }

  return items;
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
