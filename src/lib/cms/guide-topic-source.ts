import { getPagesBySection } from "@/lib/content-pages";
import { getAllGuideTopics } from "@/lib/guide-topics";
import type { BlogBodyBlock } from "@/types/blog-content-blocks";
import type { ContentPage, ContentSection } from "@/types/content-page";
import type { GuidePillarSection } from "@/types/guide-pillar";
import type { GuideTopicPage } from "@/types/guide-topic";

const GUIDE_TOPIC_SOURCE_UPDATED_AT = "2026-07-18";

function pillarSectionBlocks(section: GuidePillarSection): BlogBodyBlock[] {
  const blocks: BlogBodyBlock[] = [];
  if (section.content?.trim()) blocks.push({ type: "paragraph", text: section.content.trim() });
  for (const subsection of section.subsections ?? []) {
    blocks.push({ type: "subheading", text: subsection.title });
    blocks.push({ type: "paragraph", text: subsection.body });
  }
  if (section.table) {
    blocks.push({
      type: "table",
      headers: section.table.headers,
      rows: section.table.rows,
    });
  }
  for (const box of section.infoBoxes ?? []) {
    blocks.push({
      type: "infobox",
      variant: box.variant === "info" ? "important" : box.variant,
      title: box.title,
      body: box.body,
    });
  }
  return blocks;
}

function pillarSectionToContentSection(section: GuidePillarSection): ContentSection {
  const blocks = pillarSectionBlocks(section);
  return {
    heading: section.title,
    paragraphs: section.content?.trim() ? [section.content.trim()] : undefined,
    blocks: blocks.length ? blocks : undefined,
  };
}

/** Editable CMS source for a core topic, without flattening its tables/callouts. */
export function guideTopicToContentPage(topic: GuideTopicPage): ContentPage {
  const pillar = topic.pillarPage;
  const relatedByHref = new Map<string, NonNullable<ContentPage["relatedLinks"]>[number]>();
  for (const item of topic.relatedArticles ?? []) {
    relatedByHref.set(item.href, {
      label: item.label,
      href: item.href,
      description: item.description,
    });
  }
  for (const item of pillar?.blogLinks ?? []) {
    relatedByHref.set(item.href, {
      label: item.title,
      href: item.href,
      description: item.description,
    });
  }

  return {
    slug: topic.slug,
    section: "guide",
    title: pillar?.heroTitle ?? topic.title,
    description: pillar?.heroSubtitle ?? topic.shortDescription,
    category: "Путеводитель",
    updatedAt: GUIDE_TOPIC_SOURCE_UPDATED_AT,
    sections: pillar?.sections.map(pillarSectionToContentSection) ??
      topic.sections.map((section) => ({
        heading: section.heading,
        paragraphs: [section.body],
      })),
    relatedLinks: [...relatedByHref.values()],
  };
}

export function getGuideCmsSourcePages(): ContentPage[] {
  const bySlug = new Map<string, ContentPage>();
  for (const topic of getAllGuideTopics()) bySlug.set(topic.slug, guideTopicToContentPage(topic));
  // Dedicated long-form pages keep their own source when a slug happens to overlap.
  for (const page of getPagesBySection("guide")) bySlug.set(page.slug, page);
  return [...bySlug.values()];
}

export function getGuideCmsSourcePage(slug: string): ContentPage | undefined {
  return getGuideCmsSourcePages().find((page) => page.slug === slug);
}

