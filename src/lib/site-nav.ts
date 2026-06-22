import type {
  FlatSiteNavLink,
  SiteNavLink,
  SiteNavSection,
} from "@/types/site-nav";

export function destinationCatalogHref(label: string): string {
  return `/tours?query=${encodeURIComponent(label)}`;
}

export function resolveNavLabel(
  item: { label: string; labelKey?: string },
  t: (key: string) => string
): string {
  if (!item.labelKey) return item.label;
  const translated = t(item.labelKey);
  // Until locale messages hydrate, `t` returns the raw key — use `label` to keep SSR/client markup in sync.
  return translated === item.labelKey ? item.label : translated;
}

export function isNavHrefActive(pathname: string, href: string): boolean {
  if (href.startsWith("http") || href.startsWith("/tours?") || href.startsWith("/excursions?")) {
    if (href.startsWith("/tours?")) {
      return pathname === "/tours";
    }
    if (href.startsWith("/excursions?")) {
      return pathname === "/excursions";
    }
    return false;
  }

  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Primary catalog hubs — cross-linked from other mega-menu columns. */
const NAV_PRIMARY_HUB_PATHS = new Set([
  "/tours",
  "/excursions",
  "/destinations",
  "/blog",
  "/guide",
  "/immigration",
]);

function navLinkPathname(href: string): string {
  const path = href.split("?")[0]?.split("#")[0] ?? href;
  return path || href;
}

function sectionPrefixMatchScore(pathname: string, section: SiteNavSection): number {
  let best = 0;

  for (const prefix of section.activePathPrefixes ?? []) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      best = Math.max(best, 800 + prefix.length);
    }
  }

  if (section.href && isNavHrefActive(pathname, section.href)) {
    best = Math.max(best, 700 + navLinkPathname(section.href).length);
  }

  return best;
}

function sectionColumnMatchScore(pathname: string, section: SiteNavSection): number {
  const sectionHub = section.href ? navLinkPathname(section.href) : null;
  let best = 0;

  for (const column of section.columns ?? []) {
    for (const link of column.links) {
      if (!isNavHrefActive(pathname, link.href)) continue;

      const linkPath = navLinkPathname(link.href);
      const isCrossListedHub =
        NAV_PRIMARY_HUB_PATHS.has(linkPath) && linkPath !== sectionHub;

      if (isCrossListedHub) continue;

      best = Math.max(best, 300 + linkPath.length);
    }
  }

  return best;
}

function sectionMatchScore(pathname: string, section: SiteNavSection): number {
  return Math.max(
    sectionPrefixMatchScore(pathname, section),
    sectionColumnMatchScore(pathname, section),
  );
}

/** Returns the single best-matching nav section for a pathname. */
export function getActiveNavSectionId(
  pathname: string,
  sections: SiteNavSection[],
): string | null {
  let winner: { id: string; score: number } | null = null;

  for (const section of sections) {
    const score = sectionMatchScore(pathname, section);
    if (score <= 0) continue;
    if (!winner || score > winner.score) {
      winner = { id: section.id, score };
    }
  }

  return winner?.id ?? null;
}

export function isNavSectionActive(
  pathname: string,
  section: SiteNavSection,
  sections?: SiteNavSection[],
): boolean {
  if (sections) {
    return getActiveNavSectionId(pathname, sections) === section.id;
  }

  const score = sectionMatchScore(pathname, section);
  if (score <= 0) return false;

  // Without the full section list, only treat prefix/hub matches as active.
  // Column matches can be ambiguous when sections cross-link catalog hubs.
  return score >= 700;
}

export function flattenSiteNavSections(sections: SiteNavSection[]): FlatSiteNavLink[] {
  const items: FlatSiteNavLink[] = [];

  for (const section of sections) {
    if (section.href) {
      items.push({
        id: section.id,
        label: section.label,
        labelKey: section.labelKey,
        href: section.href,
        badge: section.badge,
        sectionId: section.id,
        sectionLabel: section.label,
      });
    }

    for (const column of section.columns ?? []) {
      for (const link of column.links) {
        items.push({
          ...link,
          sectionId: section.id,
          sectionLabel: section.label,
          columnId: column.id,
          columnTitle: column.title,
        });
      }
    }
  }

  return items;
}

export function uniqueNavLinksByHref(links: SiteNavLink[]): SiteNavLink[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}

export function getNavBadgeLabel(badge: SiteNavLink["badge"]): string | null {
  if (badge === "new") return "Новое";
  if (badge === "soon") return "Скоро";
  return null;
}

export type NavTranslate = (key: string) => string;

export function navLinkLabel(link: SiteNavLink, t: NavTranslate): string {
  return resolveNavLabel(link, t);
}

export function navSectionLabel(section: SiteNavSection, t: NavTranslate): string {
  return resolveNavLabel(section, t);
}
