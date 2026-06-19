import {
  IMMIGRATION_TOPIC_LIST,
  IMMIGRATION_TOPIC_ORDER,
  IMMIGRATION_TOPICS,
  type ImmigrationTopicSlug,
} from "@/data/immigration-topics";
import type { SearchIndexItem } from "@/lib/site-search-index";
import type { ImmigrationTopicPage } from "@/types/immigration-topic";

export { IMMIGRATION_TOPIC_LIST, IMMIGRATION_TOPIC_ORDER, IMMIGRATION_TOPICS };
export type { ImmigrationTopicSlug };

export function immigrationTopicHref(slug: string): string {
  return `/immigration/${slug}`;
}

export function isImmigrationTopicSlug(slug: string): slug is ImmigrationTopicSlug {
  return slug in IMMIGRATION_TOPICS;
}

export function getImmigrationTopicBySlug(slug: string): ImmigrationTopicPage | undefined {
  if (!isImmigrationTopicSlug(slug)) return undefined;
  return IMMIGRATION_TOPICS[slug];
}

export function getAllImmigrationTopics(): ImmigrationTopicPage[] {
  return IMMIGRATION_TOPIC_LIST;
}

export function getImmigrationTopicMetadata(
  slug: string
): { title: string; description: string } | undefined {
  const topic = getImmigrationTopicBySlug(slug);
  if (!topic) return undefined;
  const pillar = topic.pillarPage;
  const heroTitle = pillar.heroTitle ?? topic.title;
  return {
    title: pillar.metadataTitle ?? `${heroTitle} — Иммиграция`,
    description: pillar.heroSubtitle ?? topic.shortDescription,
  };
}

export function buildImmigrationTopicSearchItems(): SearchIndexItem[] {
  return getAllImmigrationTopics().map((topic) => {
    const pillar = topic.pillarPage;
    const faqKeywords = pillar.faq.flatMap((item) => [item.question, item.answer]);
    const sectionKeywords = pillar.sections.flatMap((s) => [s.title, s.content ?? ""]);

    return {
      id: `immigration-topic-${topic.slug}`,
      type: "immigration" as const,
      title: topic.title,
      description: pillar.heroSubtitle ?? topic.shortDescription,
      href: immigrationTopicHref(topic.slug),
      keywords: [
        "иммиграция",
        "внж",
        "миграция",
        topic.title,
        ...sectionKeywords,
        ...faqKeywords,
      ],
    };
  });
}
