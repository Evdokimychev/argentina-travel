import { GUIDE_TOPICS, GUIDE_TOPIC_LIST } from "@/data/guide-topics";
import { getGuidePillarBySlug } from "@/data/guide-pillars";
import type { SearchIndexItem } from "@/lib/site-search-index";
import type { GuideTopicPage } from "@/types/guide-topic";

function withPillar(topic: GuideTopicPage): GuideTopicPage {
  const pillar = getGuidePillarBySlug(topic.slug);
  if (!pillar) return topic;
  return { ...topic, pillarPage: pillar };
}

export function getGuideTopicBySlug(slug: string): GuideTopicPage | undefined {
  const topic = GUIDE_TOPICS[slug];
  if (!topic) return undefined;
  return withPillar(topic);
}

export function getAllGuideTopics(): GuideTopicPage[] {
  return GUIDE_TOPIC_LIST.map(withPillar);
}

export function isGuideTopicSlug(slug: string): boolean {
  return slug in GUIDE_TOPICS;
}

export function guideTopicHref(slug: string): string {
  return `/guide/${slug}`;
}

export function buildGuideTopicSearchItems(): SearchIndexItem[] {
  return getAllGuideTopics().map((topic) => {
    const pillar = topic.pillarPage;
    const description = pillar?.heroSubtitle ?? topic.shortDescription;
    const faqKeywords = pillar?.faq.flatMap((item) => [item.question, item.answer]) ?? [];
    const sectionKeywords =
      pillar?.sections.flatMap((s) => [s.title, s.content ?? ""]) ??
      topic.sections.flatMap((s) => [s.heading, s.body]);

    return {
      id: `guide-topic-${topic.slug}`,
      type: "guide" as const,
      title: topic.title,
      description,
      href: guideTopicHref(topic.slug),
      keywords: [
        "путеводитель",
        "гид",
        topic.title,
        ...sectionKeywords,
        ...faqKeywords,
      ],
    };
  });
}

export function getGuideTopicMetadata(slug: string): { title: string; description: string } | undefined {
  const topic = getGuideTopicBySlug(slug);
  if (!topic) return undefined;
  const pillar = topic.pillarPage;
  const heroTitle = pillar?.heroTitle ?? `${topic.title} в Аргентине`;
  return {
    title: pillar?.metadataTitle ?? `${heroTitle} — Путеводитель`,
    description: pillar?.heroSubtitle ?? topic.intro,
  };
}
