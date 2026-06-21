/** Callout variants for section and rich blog articles */
export type BlogCalloutVariant =
  | "important"
  | "tip"
  | "hack"
  | "know"
  | "mistake"
  | "warning";

export type BlogChecklistItem = {
  text: string;
  negative?: boolean;
};

export type BlogSeasonItem = {
  name: string;
  pros: string[];
  cons: string[];
};

export type BlogBudgetItem = {
  label: string;
  value: string;
};

export type BlogBodyBlock =
  | { type: "paragraph"; text: string }
  | { type: "subheading"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "checklist"; items: BlogChecklistItem[] }
  | { type: "steps"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][]; caption?: string }
  | { type: "callout"; variant: BlogCalloutVariant; title: string; body: string }
  | { type: "faq"; items: Array<{ question: string; answer: string }> }
  | { type: "divider" }
  | { type: "map"; lat: number; lng: number; label: string }
  | { type: "ticket-link"; url: string; label: string }
  | { type: "seasons"; items: BlogSeasonItem[]; conclusion?: string }
  | { type: "budget"; items: BlogBudgetItem[]; note?: string };

/** Optional CMS hint for section parsing/rendering (fallback: title heuristics) */
export type BlogSectionKind = "default" | "faq" | "mistakes" | "checklist";
