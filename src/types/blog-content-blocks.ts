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

/** Visual density for editorial blocks (comfortable is default). */
export type BlogEditorialDensity = "compact" | "comfortable" | "spacious";

export type BlogComparisonMobileLayout = "cards" | "stacked" | "tabs" | "scroll";

export type BlogPhotoVariant =
  | "full-width"
  | "content-width"
  | "wide"
  | "portrait"
  | "landscape"
  | "float-left"
  | "float-right"
  | "framed"
  | "edge-to-edge"
  | "editorial-split"
  | "with-quote"
  | "with-facts";

export type BlogGalleryVariant =
  | "grid"
  | "carousel"
  | "filmstrip"
  | "comparison"
  | "location";

export type BlogArticleSummaryVariant =
  | "cards"
  | "horizontal-deck"
  | "checklist"
  | "key-facts"
  | "quick-answer"
  | "step-by-step"
  | "timeline-summary";

export type BlogCountryTipVariant =
  | "ru-traveler"
  | "different-practice"
  | "living-in-argentina"
  | "scouting-trip";

export type BlogSourceGroup =
  | "official"
  | "legal"
  | "primary-data"
  | "ru-context"
  | "personal"
  | "updates";

export type BlogSourceItem = {
  title: string;
  url: string;
  publisher?: string;
  accessedAt?: string;
  language?: string;
  type?: BlogSourceGroup;
  notes?: string;
};

export type BlogPhraseItem = {
  original: string;
  translation: string;
  pronunciation?: string;
  context?: string;
};

export type BlogOptionSelectorItem = {
  id: string;
  title: string;
  summary: string;
  details?: string;
  meta?: string;
};

export type BlogProsConsSide = {
  title?: string;
  items: string[];
};

export type BlogArticleSummaryItem = {
  title: string;
  body: string;
  href?: string;
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
      mobileLayout?: BlogComparisonMobileLayout;
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
  | { type: "season-matrix"; highlightCurrentMonth?: boolean }
  | { type: "tourism-infographic"; compact?: boolean }
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
      variant?: BlogGalleryVariant;
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
    }
  | {
      type: "lead";
      text: string;
      variant?: "default" | "wide" | "compact" | "with-icon" | "with-author-note";
      density?: BlogEditorialDensity;
    }
  | {
      type: "photo";
      src: string;
      alt: string;
      caption?: string;
      author?: string;
      sourceUrl?: string;
      license?: string;
      width?: number;
      height?: number;
      priority?: boolean;
      variant?: BlogPhotoVariant;
      density?: BlogEditorialDensity;
    }
  | {
      type: "article-summary";
      title?: string;
      variant?: BlogArticleSummaryVariant;
      items: BlogArticleSummaryItem[];
      density?: BlogEditorialDensity;
    }
  | {
      type: "sources";
      title?: string;
      variant?: "compact" | "grouped" | "expandable";
      items: BlogSourceItem[];
      density?: BlogEditorialDensity;
    }
  | {
      type: "country-tip";
      variant?: BlogCountryTipVariant;
      title?: string;
      body: string;
      density?: BlogEditorialDensity;
    }
  | {
      type: "phrasebook";
      title?: string;
      category?: string;
      items: BlogPhraseItem[];
      density?: BlogEditorialDensity;
    }
  | {
      type: "option-selector";
      title?: string;
      description?: string;
      options: BlogOptionSelectorItem[];
      density?: BlogEditorialDensity;
    }
  | {
      type: "pros-cons";
      title?: string;
      pros: BlogProsConsSide;
      cons: BlogProsConsSide;
      recommendation?: string;
      density?: BlogEditorialDensity;
    }
  | {
      type: "hero-banner";
      eyebrow?: string;
      title: string;
      lede?: string;
      imageSrc?: string;
      imageAlt?: string;
      primaryCta?: { label: string; href: string };
      secondaryCta?: { label: string; href: string };
      density?: BlogEditorialDensity;
    }
  | {
      type: "related-links";
      title?: string;
      items: Array<{ label: string; href: string; description?: string }>;
      density?: BlogEditorialDensity;
    }
  | {
      type: "hub-cta-row";
      title?: string;
      items: Array<{ label: string; href: string; description?: string }>;
      density?: BlogEditorialDensity;
    };

/** Alias for cross-content-type page builder (blog, guide, author_article, landing). */
export type PageBuilderBlock = BlogBodyBlock;

/** Optional CMS hint for section parsing/rendering (fallback: title heuristics) */
export type BlogSectionKind = "default" | "faq" | "mistakes" | "checklist" | "tips";
