import { GUIDE_PAGES } from "@/data/guide-content";
import { IMMIGRATION_PAGES } from "@/data/immigration-content";
import type { SearchIndexItem } from "@/lib/site-search-index";
import type { ContentPage, ContentPageSection } from "@/types/content-page";

const SECTION_PAGES: Record<ContentPageSection, Record<string, ContentPage>> = {
  guide: GUIDE_PAGES,
  immigration: IMMIGRATION_PAGES,
};

export function getContentPage(
  section: ContentPageSection,
  slug: string
): ContentPage | undefined {
  return SECTION_PAGES[section][slug];
}

export function getPagesBySection(section: ContentPageSection): ContentPage[] {
  return Object.values(SECTION_PAGES[section]);
}

export function getAllContentPages(): ContentPage[] {
  return [...getPagesBySection("guide"), ...getPagesBySection("immigration")];
}

export function contentPageHref(page: ContentPage): string {
  return `/${page.section}/${page.slug}`;
}

export function getContentHubMeta(section: ContentPageSection): {
  href: string;
  label: string;
} {
  if (section === "guide") {
    return { href: "/guide", label: "Путеводитель" };
  }
  return { href: "/immigration", label: "Иммиграция" };
}

function contentSearchType(section: ContentPageSection): SearchIndexItem["type"] {
  return section;
}

export function contentPageListItem(page: ContentPage): {
  id: string;
  label: string;
  href: string;
  description: string;
} {
  const excerpt =
    page.description.length > 80 ? `${page.description.slice(0, 80)}…` : page.description;
  return {
    id: `${page.section}-${page.slug}`,
    label: page.title,
    href: contentPageHref(page),
    description: `${page.category} · ${excerpt}`,
  };
}

export function buildContentSearchItems(): SearchIndexItem[] {
  return getAllContentPages().map((page) => ({
    id: `${page.section}-${page.slug}`,
    type: contentSearchType(page.section),
    title: page.title,
    description: page.description,
    href: contentPageHref(page),
    keywords: [
      page.category,
      page.section === "guide" ? "путеводитель" : "иммиграция",
      ...page.sections.flatMap((section) => [
        section.heading,
        ...(section.paragraphs ?? []),
        ...(section.list ?? []),
      ]),
    ].filter(Boolean) as string[],
  }));
}
