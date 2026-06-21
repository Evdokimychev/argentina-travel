export type ContentSection = {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
  /** Sanitized HTML body (CMS rich text). Falls back to paragraphs when absent. */
  html?: string;
};

export type ContentRelatedLink = {
  label: string;
  href: string;
  description?: string;
};

/** Top-level site section for editorial content (guide, immigration). */
export type ContentPageSection = "guide" | "immigration";

export type ContentPage = {
  slug: string;
  section: ContentPageSection;
  title: string;
  description: string;
  category: string;
  updatedAt: string;
  sections: ContentSection[];
  relatedLinks?: ContentRelatedLink[];
  /** Pre-filled catalog search for a related tours CTA. */
  relatedTourQuery?: string;
};
