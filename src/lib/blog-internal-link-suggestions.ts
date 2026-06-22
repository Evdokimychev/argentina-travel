import {
  getBlogInternalLinkRules,
  linkifyBlogText,
  type BlogInternalLinkRule,
} from "@/lib/blog-internal-links";

export type BlogInternalLinkSuggestion = {
  ruleId: string;
  term: string;
  href: string;
  label: string;
  /** Фрагмент текста вокруг совпадения */
  context: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildTermPattern(term: string): RegExp {
  const escaped = escapeRegExp(term);
  if (/[\u0400-\u04FF]/u.test(term) && term.length >= 5) {
    const stem = escapeRegExp(term.slice(0, term.length - 1));
    return new RegExp(`(?<![\\w/])(${stem}[а-яё]{0,3})(?![\\w])`, "giu");
  }
  return new RegExp(`(?<![\\w/])(${escaped})(?![\\w])`, "giu");
}

function contextSnippet(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + length + 40);
  const snippet = text.slice(start, end).replace(/\s+/g, " ").trim();
  return (start > 0 ? "…" : "") + snippet + (end < text.length ? "…" : "");
}

/** Все предложения автоперелинковки в тексте (для CMS-превью). */
export function suggestBlogInternalLinks(
  text: string,
  rules: BlogInternalLinkRule[] = getBlogInternalLinkRules(),
): BlogInternalLinkSuggestion[] {
  if (!text.trim()) return [];

  const suggestions: BlogInternalLinkSuggestion[] = [];
  const seen = new Set<string>();

  const sortedRules = [...rules].sort(
    (a, b) => Math.max(...b.terms.map((t) => t.length)) - Math.max(...a.terms.map((t) => t.length)),
  );

  for (const rule of sortedRules) {
    for (const term of rule.terms) {
      const minLength = rule.minLength ?? 3;
      if (term.length < minLength) continue;

      const pattern = buildTermPattern(term);
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const label = match[1];
        const key = `${rule.id}:${label.toLowerCase()}:${match.index}`;
        if (seen.has(key)) continue;
        seen.add(key);

        suggestions.push({
          ruleId: rule.id,
          term,
          href: rule.href,
          label,
          context: contextSnippet(text, match.index, label.length),
        });
      }
    }
  }

  return suggestions.sort((a, b) => a.context.localeCompare(b.context, "ru"));
}

/** Собирает предложения по всем полям статьи. */
export function suggestBlogPostInternalLinks(input: {
  excerpt?: string;
  sections?: Array<{ title?: string; body?: string }>;
  content?: string;
}): BlogInternalLinkSuggestion[] {
  const chunks = [
    input.excerpt ?? "",
    input.content ?? "",
    ...(input.sections ?? []).flatMap((section) => [section.title ?? "", section.body ?? ""]),
  ].filter(Boolean);

  const merged = new Map<string, BlogInternalLinkSuggestion>();

  for (const chunk of chunks) {
    for (const suggestion of suggestBlogInternalLinks(chunk)) {
      const key = `${suggestion.href}:${suggestion.label.toLowerCase()}`;
      if (!merged.has(key)) merged.set(key, suggestion);
    }
  }

  return [...merged.values()];
}

/** Проверка, что linkify применит хотя бы одну ссылку (smoke для тестов). */
export function willLinkifyBlogText(text: string): boolean {
  return linkifyBlogText(text).some((segment) => segment.type === "link");
}
