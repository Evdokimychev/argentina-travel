import { htmlToPlainText, markdownLiteToHtml, sanitizeHtml } from "@/lib/rich-text";
import type { ContentSection } from "@/types/content-page";

export type SectionLike = Pick<ContentSection, "paragraphs" | "list" | "html">;

const CMS_SECTION_HTML_MAX = 24_000;

export { CMS_SECTION_HTML_MAX };

export function plainParagraphsToHtml(paragraphs?: string[]): string {
  if (!paragraphs?.length) return "";
  return paragraphs
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("");
}

export function resolveSectionHtml(section: SectionLike): string {
  const html = section.html?.trim();
  if (html) return sanitizeHtml(html);

  const fromParagraphs = plainParagraphsToHtml(section.paragraphs);
  if (fromParagraphs) return sanitizeHtml(fromParagraphs);

  return "";
}

export function sectionHasBodyContent(section: SectionLike): boolean {
  if (section.html?.trim()) return htmlToPlainText(section.html).trim().length > 0;
  if (section.paragraphs?.some((p) => p.trim())) return true;
  if (section.list?.some((item) => item.trim())) return true;
  return false;
}

/** Normalize CMS section after rich-text edit — keeps plain paragraphs for search/fallback. */
export function normalizeCmsSectionBody(section: ContentSection): ContentSection {
  const rawHtml = section.html?.trim() ?? "";
  const html = rawHtml ? sanitizeHtml(rawHtml) : "";
  const plain = html ? htmlToPlainText(html) : "";

  return {
    ...section,
    html: html || undefined,
    paragraphs: plain
      ? plain
          .split(/\n{2,}/)
          .map((part) => part.trim())
          .filter(Boolean)
      : section.paragraphs?.map((p) => p.trim()).filter(Boolean),
  };
}

export function paragraphsLinesToInitialHtml(paragraphs?: string[]): string {
  const joined = paragraphs?.map((p) => p.trim()).filter(Boolean).join("\n\n") ?? "";
  if (!joined) return "";
  return markdownLiteToHtml(joined);
}
