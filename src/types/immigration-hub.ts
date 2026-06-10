import type { GuidePillarFaqItem, GuidePillarHeroCta, GuidePillarTable } from "@/types/guide-pillar";
import type { TravelHubArticleLink, TravelHubQuickFact, TravelHubTocItem } from "@/types/guide-travel-hub";

export type ImmigrationHubCard = {
  emoji: string;
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
};

export type ImmigrationHubStep = {
  step: number;
  title: string;
  body: string;
  duration?: string;
};

export type ImmigrationHubChecklistItem = {
  emoji: string;
  title: string;
  description: string;
  required?: boolean;
};

export type ImmigrationHubTopicItem = {
  id: string;
  title: string;
  description: string;
  teaser: string;
  href: string;
  emoji: string;
};

export type ImmigrationHubContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroCtas: GuidePillarHeroCta[];
  quickFacts30: TravelHubQuickFact[];
  toc: TravelHubTocItem[];
  hubTopics: ImmigrationHubTopicItem[];
  warnings: string[];
  faq: GuidePillarFaqItem[];
  disclaimer: string;
};

/** @deprecated Use immigration-topic-content types for article pages */
export type ImmigrationHubTopicGroup = {
  id: string;
  title: string;
  subtitle?: string;
  topics: ImmigrationHubTopicItem[];
};

/** @deprecated Detailed section types moved to immigration-topic-content.ts */
export type ImmigrationHubResidencySection = {
  intro: string;
  types: ImmigrationHubCard[];
  groundsTable: GuidePillarTable;
  overviewHref: string;
  overviewLabel: string;
};

/** @deprecated Detailed section types moved to immigration-topic-content.ts */
export type ImmigrationHubUsefulLinksSection = {
  intro: string;
  official: TravelHubArticleLink[];
  articles: TravelHubArticleLink[];
  related: TravelHubArticleLink[];
};
