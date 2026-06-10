import type { GuidePillarFaqItem, GuidePillarHeroCta, GuidePillarTable } from "@/types/guide-pillar";
import type { TravelHubArticleLink, TravelHubQuickFact, TravelHubTocItem } from "@/types/guide-travel-hub";

export type ImmigrationHubCard = {
  emoji: string;
  title: string;
  body: string;
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

export type ImmigrationHubDnuBlock = {
  title: string;
  intro: string;
  changes: string[];
  note?: string;
};

export type ImmigrationHubAlternatives = {
  diyTitle: string;
  diyBody: string;
  proTitle: string;
  proBody: string;
  contactsHref: string;
  contactsLabel: string;
};

export type ImmigrationHubContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroCtas: GuidePillarHeroCta[];
  quickFacts30: TravelHubQuickFact[];
  toc: TravelHubTocItem[];
  whyArgentina: {
    intro: string;
    cards: ImmigrationHubCard[];
  };
  touristEntry: {
    intro: string;
    rules: string[];
    statusChangeNote: string;
    linkHref: string;
    linkLabel: string;
  };
  residencyTypes: {
    intro: string;
    types: ImmigrationHubCard[];
  };
  groundsTable: GuidePillarTable;
  residencyPath: {
    intro: string;
    steps: ImmigrationHubStep[];
    citizenshipNote: string;
  };
  dnu2025: ImmigrationHubDnuBlock;
  documents: {
    intro: string;
    checklist: ImmigrationHubChecklistItem[];
    apostilleNote: string;
  };
  radexProcess: {
    intro: string;
    steps: ImmigrationHubStep[];
    portalUrl: string;
  };
  articles: TravelHubArticleLink[];
  relatedLinks: TravelHubArticleLink[];
  warnings: string[];
  alternatives: ImmigrationHubAlternatives;
  faq: GuidePillarFaqItem[];
  disclaimer: string;
};
