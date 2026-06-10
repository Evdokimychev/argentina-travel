import type { GuidePillarFaqItem, GuidePillarHeroCta } from "@/types/guide-pillar";
import type { TravelHubArticleLink, TravelHubQuickFact, TravelHubTocItem } from "@/types/guide-travel-hub";

export type GuideIndexPlanningCard = {
  emoji: string;
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
};

export type GuideIndexTopicItem = {
  slug: string;
  title: string;
  description: string;
  href: string;
};

export type GuideIndexTopicGroup = {
  id: string;
  title: string;
  subtitle?: string;
  topics: GuideIndexTopicItem[];
};

export type GuideIndexHubContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroCtas: GuidePillarHeroCta[];
  quickFacts30: TravelHubQuickFact[];
  toc: TravelHubTocItem[];
  planning: {
    intro: string;
    cards: GuideIndexPlanningCard[];
  };
  topicGroups: GuideIndexTopicGroup[];
  relatedLinks: TravelHubArticleLink[];
  faq: GuidePillarFaqItem[];
  disclaimer: string;
};
