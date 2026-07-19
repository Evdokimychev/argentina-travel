import type { SiteNavSection } from "@/types/site-nav";
import type { SiteModulesGlobal, SiteNavigationGlobal } from "@/types/site-globals";

type VisibilityRule = {
  prefixes: readonly string[];
  enabled: (navigation: SiteNavigationGlobal) => boolean;
};

const PUBLIC_MODULE_RULES: readonly VisibilityRule[] = [
  { prefixes: ["/blog"], enabled: (value) => value.showJournal },
  { prefixes: ["/shop"], enabled: (value) => value.showShop },
  { prefixes: ["/forum"], enabled: (value) => value.showForum },
  { prefixes: ["/baza-znaniy"], enabled: (value) => value.showKnowledgeBase },
  { prefixes: ["/tours", "/podbor"], enabled: (value) => value.showTours },
  { prefixes: ["/excursions"], enabled: (value) => value.showExcursions },
  { prefixes: ["/guide"], enabled: (value) => value.showGuide },
  { prefixes: ["/gallery"], enabled: (value) => value.showGallery },
  { prefixes: ["/immigration"], enabled: (value) => value.showImmigration },
  { prefixes: ["/services"], enabled: (value) => value.showServices },
  { prefixes: ["/about"], enabled: (value) => value.showAbout },
  {
    prefixes: ["/destinations"],
    enabled: (value) => value.showGeography && value.showDestinations,
  },
  {
    prefixes: ["/places", "/collections", "/itineraries", "/mapa-argentina"],
    enabled: (value) => value.showGeography && value.showPlaces,
  },
] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicPathEnabled(
  pathname: string,
  navigation: SiteNavigationGlobal,
): boolean {
  const rule = PUBLIC_MODULE_RULES.find((candidate) =>
    candidate.prefixes.some((prefix) => matchesPrefix(pathname, prefix)),
  );
  return rule ? rule.enabled(navigation) : true;
}

export function filterPublicPaths(
  paths: string[],
  navigation: SiteNavigationGlobal,
  modules?: SiteModulesGlobal,
): string[] {
  return paths.filter((path) =>
    isPublicLinkEnabled(path, navigation, modules),
  );
}

export function isTravelModulePathEnabled(
  pathname: string,
  modules: SiteModulesGlobal,
): boolean {
  if (matchesPrefix(pathname, "/car-rental")) return modules.carRentalMode !== "disabled";
  if (matchesPrefix(pathname, "/transfers")) return modules.transfersMode !== "disabled";
  return true;
}

function internalPathnameFromHref(href: string): string | null {
  const value = href.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return null;

  try {
    return new URL(value, "https://www.goargentina.ru").pathname;
  } catch {
    return value.split(/[?#]/, 1)[0] || "/";
  }
}

/**
 * Availability check for navigation-like links. External, mail and anchor-only
 * links stay untouched; internal links respect both section and travel modes.
 */
export function isPublicLinkEnabled(
  href: string,
  navigation: SiteNavigationGlobal,
  modules?: SiteModulesGlobal,
): boolean {
  const pathname = internalPathnameFromHref(href);
  if (!pathname) return true;

  return (
    isPublicPathEnabled(pathname, navigation) &&
    (!modules || isTravelModulePathEnabled(pathname, modules))
  );
}

export function filterPublicLinks<T extends { href: string }>(
  links: readonly T[],
  navigation: SiteNavigationGlobal,
  modules?: SiteModulesGlobal,
): T[] {
  return links.filter((link) =>
    isPublicLinkEnabled(link.href, navigation, modules),
  );
}

function filterSectionLinks(
  section: SiteNavSection,
  navigation: SiteNavigationGlobal,
  modules?: SiteModulesGlobal,
): SiteNavSection {
  const columns = section.columns
    ?.map((column) => ({
      ...column,
      links: filterPublicLinks(column.links, navigation, modules),
    }))
    .filter((column) => column.links.length > 0);

  return { ...section, columns };
}

const SECTION_VISIBILITY: Partial<
  Record<string, (navigation: SiteNavigationGlobal) => boolean>
> = {
  geography: (value) => value.showGeography && (value.showDestinations || value.showPlaces),
  tours: (value) => value.showTours,
  excursions: (value) => value.showExcursions,
  guide: (value) => value.showGuide,
  gallery: (value) => value.showGallery,
  immigration: (value) => value.showImmigration,
  knowledgeBase: (value) => value.showKnowledgeBase,
  shop: (value) => value.showShop,
  services: (value) => value.showServices,
  journal: (value) => value.showJournal,
  community: (value) => value.showForum,
  about: (value) => value.showAbout,
};

export function filterSiteNavSections(
  sections: SiteNavSection[],
  navigation: SiteNavigationGlobal,
  modules?: SiteModulesGlobal,
): SiteNavSection[] {
  return sections
    .filter((section) => SECTION_VISIBILITY[section.id]?.(navigation) ?? true)
    .map((section) => filterSectionLinks(section, navigation, modules))
    .map((section) => {
      if (section.id !== "geography") return section;
      const href = navigation.showDestinations ? "/destinations" : "/places";
      return { ...section, href };
    });
}
