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

export function isNavSectionActive(pathname: string, section: SiteNavSection): boolean {
  if (section.href && isNavHrefActive(pathname, section.href)) return true;

  return (section.columns ?? []).some((column) =>
    column.links.some((link) => isNavHrefActive(pathname, link.href))
  );
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
