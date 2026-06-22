import type { BlogPost } from "@/types";
import {
  getBlogInternalLinkRules,
  type BlogInternalLinkRule,
} from "@/lib/blog-internal-links";
import { suggestBlogPostInternalLinks } from "@/lib/blog-internal-link-suggestions";

export type BlogAiLinkSuggestion = {
  slug: string;
  title: string;
  href: string;
  score: number;
  reason: string;
  source: "semantic" | "ai";
};

const STOP_WORDS = new Set([
  "и",
  "в",
  "на",
  "по",
  "для",
  "как",
  "что",
  "это",
  "или",
  "из",
  "при",
  "без",
  "the",
  "and",
  "for",
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 4 && !STOP_WORDS.has(word)),
  );
}

function ruleLinkedHrefs(text: string, rules: BlogInternalLinkRule[]): Set<string> {
  const linked = new Set<string>();
  for (const suggestion of suggestBlogPostInternalLinks({ content: text })) {
    linked.add(suggestion.href);
  }
  for (const rule of rules) {
    for (const term of rule.terms) {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        linked.add(rule.href);
      }
    }
  }
  return linked;
}

/** Rule-based semantic suggestions by title/tag overlap (not in link dictionary). */
export function suggestSemanticBlogLinks(input: {
  text: string;
  currentSlug?: string;
  catalog: BlogPost[];
  limit?: number;
}): BlogAiLinkSuggestion[] {
  const rules = getBlogInternalLinkRules();
  const alreadyLinked = ruleLinkedHrefs(input.text, rules);
  const textTokens = tokenize(input.text);
  const currentSlug = input.currentSlug?.trim();

  const scored = input.catalog
    .filter((post) => !post.noIndex && post.slug !== currentSlug)
    .flatMap((post) => {
      const href = `/blog/${post.slug}`;
      if (alreadyLinked.has(href)) return [];

      const titleTokens = tokenize(post.title);
      const tagTokens = new Set(post.tags.map((tag) => tag.toLowerCase()));
      let overlap = 0;

      for (const token of textTokens) {
        if (titleTokens.has(token)) overlap += 2;
        if (tagTokens.has(token)) overlap += 3;
      }

      if (overlap === 0) return [];

      return [
        {
          slug: post.slug,
          title: post.title,
          href,
          score: overlap,
          reason: "Совпадение по теме и тегам",
          source: "semantic" as const,
        },
      ];
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "ru"));

  return scored.slice(0, input.limit ?? 5);
}

async function suggestOpenAiBlogLinks(input: {
  text: string;
  currentSlug?: string;
  catalog: BlogPost[];
  limit?: number;
}): Promise<BlogAiLinkSuggestion[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return [];

  const candidates = input.catalog
    .filter((post) => !post.noIndex && post.slug !== input.currentSlug)
    .slice(0, 40)
    .map((post) => ({ slug: post.slug, title: post.title, tags: post.tags }));

  const prompt = [
    "Подбери до 3 slug статей блога, которые логично перелинковать в тексте.",
    "Ответ — JSON-массив объектов {slug, reason}. Только slug из списка.",
    `Текст: ${input.text.slice(0, 2000)}`,
    `Кандидаты: ${JSON.stringify(candidates)}`,
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_BLOG_LINK_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const parsed = JSON.parse(match[0]) as Array<{ slug?: string; reason?: string }>;
    const limit = input.limit ?? 5;
    const suggestions: BlogAiLinkSuggestion[] = [];

    for (const item of parsed) {
      if (!item.slug) continue;
      const post = input.catalog.find((entry) => entry.slug === item.slug);
      if (!post) continue;
      suggestions.push({
        slug: post.slug,
        title: post.title,
        href: `/blog/${post.slug}`,
        score: 10,
        reason: item.reason?.trim() || "Рекомендация ИИ",
        source: "ai",
      });
      if (suggestions.length >= limit) break;
    }

    return suggestions;
  } catch {
    return [];
  }
}

export async function suggestBlogAiLinks(input: {
  text: string;
  currentSlug?: string;
  catalog: BlogPost[];
  limit?: number;
}): Promise<BlogAiLinkSuggestion[]> {
  const semantic = suggestSemanticBlogLinks(input);
  const ai = await suggestOpenAiBlogLinks(input);

  const merged = new Map<string, BlogAiLinkSuggestion>();
  for (const entry of [...semantic, ...ai]) {
    if (!merged.has(entry.slug)) merged.set(entry.slug, entry);
  }

  return [...merged.values()].slice(0, input.limit ?? 5);
}
