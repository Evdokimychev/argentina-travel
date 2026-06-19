import type { BlogPostSection } from "@/types";

/** Ручная редакторская версия статьи — перекрывает автогенерацию */
export type EditorialOverride = {
  title?: string;
  excerpt?: string;
  seoTitle?: string;
  sections: BlogPostSection[];
  editorial?: true;
};

export function editorialArticle(
  sections: Array<{ title: string; paragraphs: string[] }>,
): EditorialOverride {
  return {
    editorial: true,
    sections: sections.map((s) => ({
      title: s.title,
      body: s.paragraphs.join(" "),
    })),
  };
}
