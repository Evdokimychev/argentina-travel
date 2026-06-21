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

export type BlogGalleryItem = {
  src: string;
  alt: string;
  caption?: string;
};

export type BlogVideoProvider = "youtube" | "vimeo";

export type BlogContentEmbedKind = "tour" | "excursion" | "article" | "guide";

export type BlogCtaVariant = "primary" | "secondary" | "outline";

export type BlogInfoboxVariant = "important" | "tip" | "warning";

export type BlogRouteMapPoint = {
  lat: number;
  lng: number;
  label: string;
};

/** Payload Blocks–compatible union — stored in content_documents JSONB. */
export type BlogBodyBlock =
  | { type: "paragraph"; text: string; html?: string }
  | { type: "subheading"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "checklist"; items: BlogChecklistItem[] }
  | { type: "steps"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][]; caption?: string }
  | {
      type: "comparison-table";
      headers: string[];
      rows: string[][];
      highlightColumn?: number;
      caption?: string;
    }
  | { type: "callout"; variant: BlogCalloutVariant; title: string; body: string }
  | { type: "infobox"; variant: BlogInfoboxVariant; title: string; body: string }
  | { type: "faq"; items: Array<{ question: string; answer: string }> }
  | { type: "accordion"; items: Array<{ title: string; body: string }> }
  | { type: "divider" }
  | { type: "map"; lat: number; lng: number; label: string }
  | { type: "route-map"; points: BlogRouteMapPoint[]; caption?: string }
  | { type: "ticket-link"; url: string; label: string }
  | { type: "cta"; label: string; href: string; variant?: BlogCtaVariant }
  | { type: "tour-booking"; tourSlug: string; label?: string; showPrice?: boolean }
  | {
      type: "content-embed";
      embedKind: BlogContentEmbedKind;
      slug: string;
      title?: string;
    }
  | { type: "seasons"; items: BlogSeasonItem[]; conclusion?: string }
  | { type: "season-matrix" }
  | { type: "tourism-infographic" }
  | { type: "tourism-timeline" }
  | { type: "budget"; items: BlogBudgetItem[]; note?: string }
  | { type: "media"; src: string; alt: string; caption?: string }
  | { type: "gallery"; items: BlogGalleryItem[]; columns?: 2 | 3 | 4 }
  | {
      type: "video";
      provider: BlogVideoProvider;
      videoId: string;
      title?: string;
      caption?: string;
    }
  | {
      type: "widget";
      widgetKey: string;
      title?: string;
      config?: Record<string, string>;
    };

/** Alias for cross-content-type page builder (blog, guide, author_article, landing). */
export type PageBuilderBlock = BlogBodyBlock;

/** Optional CMS hint for section parsing/rendering (fallback: title heuristics) */
export type BlogSectionKind = "default" | "faq" | "mistakes" | "checklist";
