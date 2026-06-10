import type {
  GuidePartnerCard,
  GuidePillarBlogLink,
  GuidePillarContent,
  GuidePillarHeroCta,
  GuidePillarSection,
} from "@/types/guide-pillar";

export type {
  GuidePartnerCard,
  GuidePillarBlogLink,
  GuidePillarContent,
  GuidePillarFaqItem,
  GuidePillarHeroCta,
  GuidePillarInfoBox,
  GuidePillarInfoBoxVariant,
  GuidePillarSection,
  GuidePillarSubsection,
  GuidePillarTable,
  GuidePillarWidgetSlot,
  GuidePillarWidgetSlotType,
  GuidePracticalTips,
  GuideQuickFact,
} from "@/types/guide-pillar";

/** Hub page for a core guide topic (practical info + services + related reading). */
export type GuideTopicPage = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  intro: string;
  sections: Array<{ heading: string; body: string }>;
  serviceCards?: GuideTopicServiceCard[];
  tourRecommendations?: Array<{ label: string; href: string; query?: string }>;
  relatedArticles?: Array<{ label: string; href: string; description?: string }>;
  relatedDestinations?: Array<{ label: string; href: string; description?: string }>;
  heroImage?: string;
  features?: { exchangeRates?: boolean };
  /** Full Ultimate Guide pillar layout — rendered by GuidePillarView when present. */
  pillarPage?: GuidePillarContent;
};

export type GuideTopicServiceCard = {
  title: string;
  description: string;
  href: string;
  external?: boolean;
  ctaLabel: string;
};

export function serviceCardsToPartners(cards: GuideTopicServiceCard[]): GuidePartnerCard[] {
  return cards.map((card) => ({
    title: card.title,
    description: card.description,
    href: card.href,
    external: card.external,
    ctaLabel: card.ctaLabel,
  }));
}

export function defaultHeroCtas(
  slug: string,
  primary: { label: string; href: string },
  secondary: { label: string; href: string }
): GuidePillarHeroCta[] {
  return [
    { ...primary, variant: "primary" },
    { ...secondary, variant: "secondary" },
    { label: "Задать вопрос", href: `/contacts?topic=${slug}`, variant: "tertiary" },
  ];
}

export function sectionsFromTopic(
  slug: string,
  topicSections: GuideTopicPage["sections"]
): GuidePillarSection[] {
  return topicSections.map((section, index) => ({
    id: `${slug}-${index + 1}`,
    title: section.heading,
    content: section.body,
  }));
}

export function relatedToBlogLinks(
  topic: GuideTopicPage
): GuidePillarBlogLink[] {
  return (topic.relatedArticles ?? []).map((a) => ({
    title: a.label,
    href: a.href,
    description: a.description,
  }));
}
