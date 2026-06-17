export type GuidePillarInfoBoxVariant = "tip" | "warning" | "info";

export type GuidePillarInfoBox = {
  variant: GuidePillarInfoBoxVariant;
  title: string;
  body: string;
};

export type GuidePillarTable = {
  headers: string[];
  rows: string[][];
};

export type GuidePillarSubsection = {
  title: string;
  body: string;
};

export type GuidePillarSection = {
  id: string;
  title: string;
  content?: string;
  subsections?: GuidePillarSubsection[];
  table?: GuidePillarTable;
  infoBoxes?: GuidePillarInfoBox[];
  widgetSlot?: GuidePillarWidgetSlot;
};

export type GuidePillarFaqItem = {
  question: string;
  answer: string;
};

export type GuidePartnerCard = {
  title: string;
  description: string;
  href: string;
  external?: boolean;
  ctaLabel?: string;
  softIntro?: string;
};

export type GuidePillarBlogLink = {
  title: string;
  href: string;
  description?: string;
};

export type GuidePillarWidgetSlotType =
  | "exchange-rates"
  | "calculator"
  | "map"
  | "promo"
  | "weather-panel"
  | "tour-embed";

export type GuidePillarWidgetSlot = {
  id: string;
  label: string;
  type: GuidePillarWidgetSlotType;
  tourEmbed?: import("@/types/tour-embed").TourEmbedConfig;
};

export type GuidePracticalTips = {
  do: string[];
  consider: string[];
  avoid: string[];
};

export type GuideQuickFact = {
  emoji?: string;
  label: string;
  /** Официальный испанский термин — показывается бейджем под label */
  labelEs?: string;
  /** Короткий главный вывод */
  headline: string;
  /** Расшифровка — контекст, который можно прочитать за секунды */
  detail?: string;
  /** @deprecated Используйте headline + detail */
  value?: string;
  /** Render live exchange rate instead of static headline */
  live?: "exchange-oficial" | "exchange-blue";
};

export type GuidePillarHeroCta = {
  label: string;
  href: string;
  variant: "primary" | "secondary" | "tertiary";
  external?: boolean;
};

export type GuidePillarContent = {
  /** Overrides default metadata title for pillar pages */
  metadataTitle?: string;
  /** Defaults to «{topic title} в Аргентине» when omitted */
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtas: GuidePillarHeroCta[];
  quickFacts: GuideQuickFact[];
  practicalTips?: GuidePracticalTips;
  sections: GuidePillarSection[];
  faq: GuidePillarFaqItem[];
  partnerServices: GuidePartnerCard[];
  blogLinks: GuidePillarBlogLink[];
  widgetSlots?: GuidePillarWidgetSlot[];
  /** Soft intro above partner cards block */
  recommendIntro?: string;
};
