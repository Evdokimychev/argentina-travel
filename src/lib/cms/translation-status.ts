import type { CmsDocument, CmsDocumentBody } from "@/types/cms-content";

export type CmsLocaleTranslationStatus =
  | "missing"
  | "draft"
  | "archived"
  | "published_incomplete"
  | "published_complete";

export type CmsTranslationStatus = {
  ru_complete: boolean;
  es_status: CmsLocaleTranslationStatus;
  en_status: CmsLocaleTranslationStatus;
};

function hasText(value: string | undefined | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasTextList(items: string[] | undefined): boolean {
  return Array.isArray(items) && items.some((item) => hasText(item));
}

function hasRichSections(
  sections:
    | Array<{
        heading?: string;
        paragraphs?: string[];
        list?: string[];
        html?: string;
        blocks?: unknown[];
      }>
    | undefined
): boolean {
  return (
    Array.isArray(sections) &&
    sections.some(
      (section) =>
        hasText(section.heading) ||
        hasText(section.html) ||
        hasTextList(section.paragraphs) ||
        hasTextList(section.list) ||
        (Array.isArray(section.blocks) && section.blocks.length > 0)
    )
  );
}

function isBodyComplete(body: CmsDocumentBody): boolean {
  switch (body.kind) {
    case "legal":
      return hasText(body.description) && hasRichSections(body.sections);
    case "blog":
      return (
        hasText(body.excerpt) ||
        hasText(body.content) ||
        (Array.isArray(body.sections) &&
          body.sections.some((section) => hasText(section.title) || hasText(section.body)))
      );
    case "guide":
      return hasText(body.description) && hasRichSections(body.sections);
    case "destination":
      return (
        hasText(body.description) &&
        (hasText(body.intro) ||
          hasText(body.bestSeason) ||
          hasText(body.idealDuration) ||
          hasText(body.howToGetThere) ||
          hasTextList(body.highlights) ||
          hasTextList(body.travelTips))
      );
    case "place":
      return hasText(body.shortDescription) && hasText(body.fullDescription);
    default:
      return false;
  }
}

export function isCmsDocumentComplete(
  document: Pick<CmsDocument, "title" | "body"> | null | undefined
): boolean {
  if (!document) return false;
  return hasText(document.title) && isBodyComplete(document.body);
}

export function toLocaleTranslationStatus(
  document: CmsDocument | null | undefined
): CmsLocaleTranslationStatus {
  if (!document) return "missing";
  if (document.status === "draft" || document.status === "scheduled") return "draft";
  if (document.status === "archived") return "archived";
  return isCmsDocumentComplete(document) ? "published_complete" : "published_incomplete";
}

export function buildDefaultTranslationStatus(ruComplete: boolean): CmsTranslationStatus {
  return {
    ru_complete: ruComplete,
    es_status: "missing",
    en_status: "missing",
  };
}

export function isPublishedTranslationComplete(status: CmsLocaleTranslationStatus): boolean {
  return status === "published_complete";
}
