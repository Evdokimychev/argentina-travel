import { POPULAR_DESTINATIONS } from "@/data/filters";
import { GUIDE_TOPICS } from "@/data/guide-topics";
import { SITE_NAV_RECENT_BLOG_LINKS } from "@/data/site-nav-blog-links";
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

/** Explicit Markdown links written by editors / SSOT content (internal + external). */
const MARKDOWN_LINK_RE = /\[([^\]]+)\]\((\/[^)\s]+|https?:\/\/[^)\s]+)\)/g;

function blogSlugRules(): BlogInternalLinkRule[] {
  const publishedHrefs = new Set(SITE_NAV_RECENT_BLOG_LINKS.map((link) => link.href));
  const rules: BlogInternalLinkRule[] = [];

  if (publishedHrefs.has("/blog/argentina-tourist-visa-2026")) {
    rules.push({
      id: "visa-entry",
      terms: VISA_TERMS,
      href: "/blog/argentina-tourist-visa-2026",
      minLength: 4,
    });
  }
  if (publishedHrefs.has("/blog/itinerary-чек-лист")) {
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

/** Правила автоперелинковки.
 * По умолчанию — без городов/гайдов: только явные Markdown-ссылки редактора
 * и узкие служебные темы (виза, чек-лист). Случайное подсвечивание «Мендоса да / Игуасу нет»
 * в длинных статьях отключено намеренно.
 */
export function getBlogInternalLinkRules(
  options: {
    includeDestinations?: boolean;
    includeGuides?: boolean;
  } = {},
): BlogInternalLinkRule[] {
  const { includeDestinations = false, includeGuides = false } = options;
  const rules: BlogInternalLinkRule[] = [...blogSlugRules()];
  if (includeDestinations) rules.push(...destinationRules());
  if (includeGuides) rules.push(...guideRules());
  return rules.sort(
    (a, b) => Math.max(...b.terms.map((t) => t.length)) - Math.max(...a.terms.map((t) => t.length)),
  );
}

/** Полный набор автоссылок (города + гайды) — только если явно нужен. */
export function getBlogFullAutoLinkRules(): BlogInternalLinkRule[] {
  return getBlogInternalLinkRules({ includeDestinations: true, includeGuides: true });
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
  if (/[\u0400-\u04FF]/u.test(term) && term.length >= 5) {
    const stem = escapeRegExp(term.slice(0, term.length - 1));
    return new RegExp(`(?<![\\w/])(${stem}[а-яё]{0,3})(?![\\w])`, "giu");
  }
  return new RegExp(`(?<![\\w/])(${escaped})(?![\\w])`, "giu");
}

/** Ranges that must not be auto-linked: bold and inline code. */
function collectProtectedRanges(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  const patterns = [/\*\*[^*]+\*\*/g, /`[^`]+`/g];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      ranges.push({ start: match.index, end: match.index + match[0].length });
    }
  }
  return ranges;
}

function overlapsProtected(
  ranges: Array<{ start: number; end: number }>,
  start: number,
  end: number,
): boolean {
  return ranges.some((range) => start < range.end && end > range.start);
}

function linkifyPlainText(
  text: string,
  rules: BlogInternalLinkRule[],
  linkedHrefs: Set<string>,
  remainingLinks: number,
): BlogInternalLinkSegment[] {
  if (!text.trim()) return [{ type: "text", value: text }];
  if (remainingLinks <= 0) return [{ type: "text", value: text }];

  const protectedRanges = collectProtectedRanges(text);
  const sortedTerms = rules
    .flatMap((rule) =>
      rule.terms.map((term) => ({
        term,
        href: rule.href,
        minLength: rule.minLength ?? 3,
      })),
    )
    .sort((a, b) => b.term.length - a.term.length);

  for (const { term, href, minLength } of sortedTerms) {
    if (term.length < minLength) continue;
    if (linkedHrefs.has(href)) continue;

    const pattern = buildTermPattern(term);
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      if (match.index === undefined) continue;
      const label = match[1];
      const start = match.index;
      const end = start + label.length;
      if (overlapsProtected(protectedRanges, start, end)) continue;

      const before = text.slice(0, start);
      const after = text.slice(end);
      const segments: BlogInternalLinkSegment[] = [];
      if (before) segments.push({ type: "text", value: before });
      segments.push({ type: "link", value: label, href, label });
      linkedHrefs.add(href);
      if (after) {
        segments.push(...linkifyPlainText(after, rules, linkedHrefs, remainingLinks - 1));
      }
      return segments;
    }
  }

  return [{ type: "text", value: text }];
}

/**
 * Разбивает текст: сначала явные Markdown-ссылки редактора,
 * затем до трёх разных автоссылок по правилам.
 * Не ломает выделение bold/italic/code и уже написанные URL.
 */
export function linkifyBlogText(
  text: string,
  rules: BlogInternalLinkRule[] = getBlogInternalLinkRules(),
): BlogInternalLinkSegment[] {
  const linkedHrefs = new Set<string>();
  const segments: BlogInternalLinkSegment[] = [];
  let remainingAutoLinks = MAX_AUTO_LINKS_PER_TEXT;
  let lastIndex = 0;
  const markdownLinkRe = new RegExp(MARKDOWN_LINK_RE.source, "g");
  let match: RegExpExecArray | null;

  while ((match = markdownLinkRe.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plain = linkifyPlainText(
        text.slice(lastIndex, match.index),
        rules,
        linkedHrefs,
        remainingAutoLinks,
      );
      remainingAutoLinks -= plain.filter((segment) => segment.type === "link").length;
      segments.push(...plain);
    }

    const label = match[1];
    const href = match[2];
    segments.push({ type: "link", value: label, href, label });
    linkedHrefs.add(href);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push(
      ...linkifyPlainText(text.slice(lastIndex), rules, linkedHrefs, remainingAutoLinks),
    );
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}

export function isExternalBlogHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
