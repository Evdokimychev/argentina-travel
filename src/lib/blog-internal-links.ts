import { POPULAR_DESTINATIONS } from "@/data/filters";
import { GUIDE_TOPICS } from "@/data/guide-topics";
import { blogPosts } from "@/data/blog";
import { buildPublishedBlogSlugSet } from "@/lib/blog-slug-resolve";
import { getSafeBlogDestinationTerms } from "@/lib/blog-destination-terms";

export type BlogInternalLinkRule = {
  id: string;
  terms: readonly string[];
  href: string;
  /** Минимальная длина совпадения (символов) для избежания ложных срабатываний */
  minLength?: number;
};

const VISA_TERMS = [
  "безвиз",
  "виза",
  "въезд",
  "миграц",
  "DNI",
  "RADEX",
  "ВНЖ",
  "паспорт",
  "precaria",
  "residencia",
] as const;

function blogSlugRules(): BlogInternalLinkRule[] {
  const slugs = buildPublishedBlogSlugSet(blogPosts.map((p) => p.slug));
  const rules: BlogInternalLinkRule[] = [];

  if (slugs.has("argentina-tourist-visa-2026")) {
    rules.push({
      id: "visa-entry",
      terms: VISA_TERMS,
      href: "/blog/argentina-tourist-visa-2026",
      minLength: 4,
    });
  }

  if (slugs.has("itinerary-чек-лист")) {
    rules.push({
      id: "checklist",
      terms: ["чек-лист", "чеклист", "контрольный список"],
      href: "/blog/itinerary-чек-лист",
      minLength: 5,
    });
  }

  return rules;
}

function destinationRules(): BlogInternalLinkRule[] {
  return POPULAR_DESTINATIONS.map((dest) => ({
    id: `dest-${dest.id}`,
    terms: getSafeBlogDestinationTerms(dest).slice(0, 5),
    href: `/destinations/${dest.id}`,
    minLength: 4,
  }));
}

function guideRules(): BlogInternalLinkRule[] {
  return Object.values(GUIDE_TOPICS).map((topic) => ({
    id: `guide-${topic.slug}`,
    terms: [topic.title],
    href: `/guide/${topic.slug}`,
    minLength: 5,
  }));
}

/** Правила автоперелинковки — первое вхождение термина в тексте секции. */
export function getBlogInternalLinkRules(): BlogInternalLinkRule[] {
  return [...blogSlugRules(), ...destinationRules(), ...guideRules()].sort(
    (a, b) => Math.max(...b.terms.map((t) => t.length)) - Math.max(...a.terms.map((t) => t.length)),
  );
}

export type BlogInternalLinkSegment =
  | { type: "text"; value: string }
  | { type: "link"; value: string; href: string; label: string };

const MAX_AUTO_LINKS_PER_TEXT = 3;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildTermPattern(term: string): RegExp {
  const escaped = escapeRegExp(term);
  // Русские склонения: корень + до 3 букв окончания
  if (/^[а-яё]+$/iu.test(term) && term.length >= 5) {
    const stem = escapeRegExp(term.slice(0, term.length - 1));
    return new RegExp(`(?<![\\w/])(${stem}[а-яё]{0,3})(?![\\w])`, "iu");
  }
  return new RegExp(`(?<![\\w/])(${escaped})(?![\\w])`, "iu");
}

/** Разбивает текст на сегменты с одной автоссылкой (первое совпадение). */
function linkifyBlogTextInternal(
  text: string,
  rules: BlogInternalLinkRule[],
  linkedHrefs: Set<string>,
  remainingLinks: number,
): BlogInternalLinkSegment[] {
  if (!text.trim()) return [{ type: "text", value: text }];
  if (remainingLinks <= 0) return [{ type: "text", value: text }];

  const sortedTerms = rules.flatMap((rule) =>
    rule.terms.map((term) => ({
      term,
      href: rule.href,
      minLength: rule.minLength ?? 3,
    })),
  ).sort((a, b) => b.term.length - a.term.length);

  for (const { term, href, minLength } of sortedTerms) {
    if (term.length < minLength) continue;
    if (linkedHrefs.has(href)) continue;

    const pattern = buildTermPattern(term);
    const match = pattern.exec(text);
    if (!match || match.index === undefined) continue;

    const before = text.slice(0, match.index);
    const label = match[1];
    const after = text.slice(match.index + label.length);

    const segments: BlogInternalLinkSegment[] = [];
    if (before) segments.push({ type: "text", value: before });
    segments.push({ type: "link", value: label, href, label });
    linkedHrefs.add(href);
    if (after) {
      segments.push(
        ...linkifyBlogTextInternal(after, rules, linkedHrefs, remainingLinks - 1),
      );
    }
    return segments;
  }

  return [{ type: "text", value: text }];
}

/** Разбивает текст максимум на три разные смысловые автоссылки. */
export function linkifyBlogText(
  text: string,
  rules: BlogInternalLinkRule[] = getBlogInternalLinkRules(),
): BlogInternalLinkSegment[] {
  return linkifyBlogTextInternal(text, rules, new Set(), MAX_AUTO_LINKS_PER_TEXT);
}
