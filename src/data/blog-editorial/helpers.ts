import type { BlogPostSection, BlogRelatedResource } from "@/types";

export function p(...paragraphs: string[]): string[] {
  return paragraphs.filter(Boolean);
}

export function blogResource(slug: string, label: string): BlogRelatedResource {
  return { label, href: `/blog/${slug}`, type: "blog" };
}

export function guideResource(slug: string, label: string): BlogRelatedResource {
  return { label, href: `/guide/${slug}`, type: "guide" };
}

export function section(title: string, paragraphs: string[]): { title: string; paragraphs: string[] } {
  return { title, paragraphs };
}

export function sectionsToContent(sections: BlogPostSection[]): string {
  return sections.map((s) => s.body).join(" ");
}

export function estimateReadMinutesFromSections(sections: BlogPostSection[]): number {
  const words = sectionsToContent(sections).split(/\s+/).length;
  return Math.min(22, Math.max(9, Math.round(words / 140)));
}
