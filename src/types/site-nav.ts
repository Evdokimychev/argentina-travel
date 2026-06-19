export type SiteNavBadge = "new" | "soon";

export type SiteNavLink = {
  id: string;
  label: string;
  labelKey?: string;
  href: string;
  external?: boolean;
  badge?: SiteNavBadge;
  description?: string;
  /** Guide topic slug — used for icon lookup in the guide mega-menu. */
  topicSlug?: string;
};

export type SiteNavColumn = {
  id: string;
  title: string;
  titleKey?: string;
  links: SiteNavLink[];
};

/** Top-level header section — direct link and/or mega-menu columns. */
export type SiteNavSection = {
  id: string;
  label: string;
  labelKey?: string;
  /** Direct navigation when the section has no dropdown. */
  href?: string;
  /** Short teaser shown in compact mega-menu blocks (e.g. «Ещё»). */
  description?: string;
  /** Extra path prefixes that mark this section active (e.g. merged geography hub). */
  activePathPrefixes?: string[];
  columns?: SiteNavColumn[];
  badge?: SiteNavBadge;
};

export type FlatSiteNavLink = SiteNavLink & {
  sectionId: string;
  sectionLabel: string;
  columnId?: string;
  columnTitle?: string;
};
