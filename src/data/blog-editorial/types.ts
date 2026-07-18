import type { BlogPostSection, BlogRelatedResource } from "@/types";

/** Ручная редакторская версия статьи — перекрывает автогенерацию */
export type EditorialOverride = {
  title?: string;
  excerpt?: string;
  seoTitle?: string;
  sections: BlogPostSection[];
  editorial?: true;
  relatedResources?: BlogRelatedResource[];
  dateModified?: string;
  image?: string;
  /** Fail-closed publication switch for a manually written article awaiting factual review. */
  publicationReady?: boolean;
  /** Internal reason shown only in editorial tooling, never in the public article. */
  publicationBlockReason?: string;
};

export function isEditorialOverridePublicationReady(override: EditorialOverride): boolean {
  return override.publicationReady !== false;
}

export function editorialArticle(
  sections: Array<{ title: string; paragraphs: string[] }>,
): EditorialOverride {
  return {
    editorial: true,
    sections: sections.map((s) => ({
      title: s.title,
      body: s.paragraphs.join("\n\n"),
    })),
  };
}
