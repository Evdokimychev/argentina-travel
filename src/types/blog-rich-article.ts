export type BlogRichCalloutVariant = "info" | "tip" | "warning";

export type BlogRichSpot = {
  rank: number;
  title: string;
  why: string;
  duration: string;
  difficulty: string;
  tip: string;
};

export type BlogRichSeason = {
  name: string;
  pros: string[];
  cons: string[];
};

export type BlogRichBlock =
  | { type: "paragraphs"; items: string[] }
  | {
      type: "callout";
      variant: BlogRichCalloutVariant;
      title: string;
      body: string;
    }
  | { type: "stats"; items: Array<{ label: string; value: string }> }
  | {
      type: "links";
      title?: string;
      items: Array<{ label: string; href: string; external?: boolean }>;
    }
  | { type: "spots"; items: BlogRichSpot[] }
  | { type: "table"; headers: string[]; rows: string[][]; caption?: string }
  | { type: "bullets"; title?: string; items: string[] }
  | { type: "seasons"; items: BlogRichSeason[]; conclusion?: string }
  | { type: "faq"; items: Array<{ question: string; answer: string }> }
  | {
      type: "ratings";
      items: Array<{ label: string; stars: number }>;
      audience: string[];
      note?: string;
    }
  | { type: "numbered-tips"; items: string[] };

export type BlogRichArticleSection = {
  id: string;
  title: string;
  blocks: BlogRichBlock[];
};

export type BlogRichArticle = {
  id: string;
  lede: string;
  /** Дополнительные абзацы вступления (после lede, до секций) */
  intro?: string[];
  updatedLabel?: string;
  sections: BlogRichArticleSection[];
  faq?: Array<{ question: string; answer: string }>;
};
