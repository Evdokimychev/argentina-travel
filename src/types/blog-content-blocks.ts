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

export type BlogImageTextPosition = "left" | "right";

export type BlogFactItem = {
  label: string;
  value: string;
  description?: string;
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
      /** Mobile: cards = stacked row cards without horizontal scroll */
      mobileLayout?: "scroll" | "cards";
    }
  | { type: "callout"; variant: BlogCalloutVariant; title: string; body: string }
  | { type: "infobox"; variant: BlogInfoboxVariant; title: string; body: string }
  | { type: "faq"; items: Array<{ question: string; answer: string }> }
  | { type: "accordion"; items: Array<{ title: string; body: string; id?: string }> }
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
  | {
      type: "image-text";
      src: string;
      alt: string;
      title: string;
      body: string;
      imagePosition?: BlogImageTextPosition;
      caption?: string;
    }
  | {
      type: "author-card";
      name: string;
      role?: string;
      bio: string;
      avatarSrc?: string;
      avatarAlt?: string;
      href?: string;
      linkLabel?: string;
    }
  | {
      type: "facts-grid";
      title?: string;
      items: BlogFactItem[];
      columns?: 2 | 3 | 4;
    }
  | {
      type: "quote";
      text: string;
      author?: string;
      context?: string;
    }
  | {
      type: "gallery";
      items: BlogGalleryItem[];
      columns?: 2 | 3 | 4;
      /** carousel = листание (по умолчанию при 2+ фото); grid = плитка */
      layout?: "carousel" | "grid" | "auto";
      ariaLabel?: string;
    }
  | {
      type: "link-chips";
      title?: string;
      items: Array<{ label: string; href: string; emoji?: string }>;
    }
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
export type BlogSectionKind = "default" | "faq" | "mistakes" | "checklist" | "tips";
