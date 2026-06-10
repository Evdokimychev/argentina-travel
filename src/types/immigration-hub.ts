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
  href: string;
  emoji: string;
};

export type ImmigrationHubTopicGroup = {
  id: string;
  title: string;
  subtitle?: string;
  topics: ImmigrationHubTopicItem[];
};

export type ImmigrationHubContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroCtas: GuidePillarHeroCta[];
  quickFacts30: TravelHubQuickFact[];
  toc: TravelHubTocItem[];
  /** Карточки-якоря основных блоков справочника */
  hubTopics: ImmigrationHubTopicItem[];
  lifeInCountry: {
    intro: string;
    cards: ImmigrationHubCard[];
  };
  immigrationProcess: {
    intro: string;
    touristRules: string[];
    statusChangeNote: string;
    dnuTitle: string;
    dnuChanges: string[];
    dnuNote: string;
    radexSteps: ImmigrationHubStep[];
    radexPortalUrl: string;
    documentsIntro: string;
    documentsChecklist: ImmigrationHubChecklistItem[];
    apostilleNote: string;
    entryDocsHref: string;
    entryDocsLabel: string;
  };
  birthInArgentina: {
    intro: string;
    cards: ImmigrationHubCard[];
    steps: ImmigrationHubStep[];
    note: string;
  };
  citizenship: {
    intro: string;
    cards: ImmigrationHubCard[];
    pathSteps: ImmigrationHubStep[];
    note: string;
  };
  residency: {
    intro: string;
    types: ImmigrationHubCard[];
    groundsTable: GuidePillarTable;
    overviewHref: string;
    overviewLabel: string;
  };
  opportunities: {
    intro: string;
    highlights: ImmigrationHubCard[];
    alternatives: ImmigrationHubCard[];
    diyTitle: string;
    diyBody: string;
    proTitle: string;
    proBody: string;
    contactsHref: string;
    contactsLabel: string;
  };
  usefulLinks: {
    intro: string;
    official: TravelHubArticleLink[];
    articles: TravelHubArticleLink[];
    related: TravelHubArticleLink[];
  };
  warnings: string[];
  faq: GuidePillarFaqItem[];
  disclaimer: string;
};
