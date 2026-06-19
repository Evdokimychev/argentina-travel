import type { GuidePillarFaqItem, GuidePillarHeroCta, GuidePillarTable } from "@/types/guide-pillar";

export type TravelHubTocItem = {
  id: string;
  label: string;
};

export type TravelHubQuickFact = {
  emoji: string;
  label: string;
  /** Официальный испанский термин — показывается бейджем под label */
  labelEs?: string;
  headline: string;
  detail?: string;
  /** @deprecated Используйте headline + detail */
  value?: string;
};

export type TravelHubAirlineNoteType = "info" | "tech-stop" | "connection" | "from-russia" | "hub";

export type TravelHubAirlineNote = {
  text: string;
  type?: TravelHubAirlineNoteType;
};

export type TravelHubAirline = {
  name: string;
  route: string;
  notes?: TravelHubAirlineNote[];
};

export type TravelHubTransportMode = {
  id: string;
  title: string;
  emoji: string;
  summary: string;
  highlight?: boolean;
  airlineIntro?: string;
  airlines?: TravelHubAirline[];
  borderCountries?: { country: string; href?: string }[];
  note?: string;
};

export type TravelHubAirport = {
  code: string;
  name: string;
  city: string;
  emoji: string;
  description: string;
};

export type TravelHubAirlineCompareSummary = {
  handLuggage: string;
  baggage: string;
  loyalty: string;
  priceHint: string;
};

export type TravelHubAirlineBadge = "recommended" | "network" | "caution";

export type TravelHubAirlineCompare = {
  name: string;
  tagline: string;
  badge?: TravelHubAirlineBadge;
  summary: TravelHubAirlineCompareSummary;
  handLuggage: string;
  checkedBaggage: string;
  loyaltyProgram: string;
  comfort: string;
  punctuality: string;
  price: string;
  warning?: string;
  note?: string;
};

export type TravelHubSeasonalRoute = {
  route: string;
  season: string;
};

export type TravelHubEntryDoc = {
  emoji: string;
  title: string;
  description: string;
};

export type TravelHubTip = {
  emoji: string;
  title: string;
  body: string;
};

export type TravelHubArticleLink = {
  title: string;
  href: string;
  description: string;
};

export type TravelHubMonetizationItem = {
  emoji: string;
  title: string;
  description: string;
  href: string;
  external?: boolean;
};

export type TravelHubContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroCtas: GuidePillarHeroCta[];
  quickFacts30: TravelHubQuickFact[];
  toc: TravelHubTocItem[];
  transportModes: TravelHubTransportMode[];
  aviasalesBenefits: string[];
  airports: TravelHubAirport[];
  domesticAirlinesIntro?:
    string;
  domesticAirlines: TravelHubAirlineCompare[];
  domesticRoutesIntro: string;
  seasonalRoutes: TravelHubSeasonalRoute[];
  patagoniaNote: string;
  entryDocsIntro?: string;
  entryVisaFree?: {
    title: string;
    summary: string;
    countriesNote: string;
    rules: string[];
  };
  entryHealthcare?: {
    title: string;
    body: string;
    emergencyNumbers: string[];
  };
  entryFunds?: string;
  entryDocs: TravelHubEntryDoc[];
  entryWarnings: string[];
  insurance: {
    title: string;
    body: string;
    href: string;
    ctaLabel: string;
    external?: boolean;
  };
  transferTables: {
    id: string;
    title: string;
    table: GuidePillarTable;
  }[];
  guidedAirportTransfers?: {
    title: string;
    subtitle: string;
    options: {
      id: string;
      airportCode: string;
      airportLabel: string;
      route: string;
      priceUsd: number;
      duration: string;
      highlights: string[];
      href: string;
    }[];
    ctaLabel: string;
  };
  ezeAepTransfer: {
    distance: string;
    duration: string;
    taxiCost: string;
    transferCost: string;
    tips: string[];
  };
  tips: TravelHubTip[];
  articles: TravelHubArticleLink[];
  monetization: TravelHubMonetizationItem[];
  faq: GuidePillarFaqItem[];
};
