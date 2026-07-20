import type { SiteNavSection } from "@/types/site-nav";
import type {
  SiteModulesGlobal,
  SiteNavigationGlobal,
  SitePublicModuleId,
} from "@/types/site-globals";

type VisibilityRule = {
  prefixes: readonly string[];
  moduleId: SitePublicModuleId;
  navigationEnabled: (navigation: SiteNavigationGlobal) => boolean;
  parentModuleId?: SitePublicModuleId;
};

const PUBLIC_MODULE_RULES: readonly VisibilityRule[] = [
  { prefixes: ["/blog"], moduleId: "journal", navigationEnabled: (value) => value.showJournal },
  { prefixes: ["/shop"], moduleId: "shop", navigationEnabled: (value) => value.showShop },
  { prefixes: ["/forum"], moduleId: "forum", navigationEnabled: (value) => value.showForum },
  { prefixes: ["/baza-znaniy"], moduleId: "knowledgeBase", navigationEnabled: (value) => value.showKnowledgeBase },
  { prefixes: ["/tours", "/podbor"], moduleId: "tours", navigationEnabled: (value) => value.showTours },
  { prefixes: ["/excursions"], moduleId: "excursions", navigationEnabled: (value) => value.showExcursions },
  { prefixes: ["/guide"], moduleId: "guide", navigationEnabled: (value) => value.showGuide },
  { prefixes: ["/gallery"], moduleId: "gallery", navigationEnabled: (value) => value.showGallery },
  { prefixes: ["/immigration"], moduleId: "immigration", navigationEnabled: (value) => value.showImmigration },
  { prefixes: ["/services"], moduleId: "services", navigationEnabled: (value) => value.showServices },
  { prefixes: ["/about"], moduleId: "about", navigationEnabled: (value) => value.showAbout },
  {
    prefixes: ["/destinations"],
    moduleId: "destinations",
    parentModuleId: "geography",
    navigationEnabled: (value) => value.showGeography && value.showDestinations,
  },
  {
    prefixes: ["/places", "/collections", "/itineraries", "/mapa-argentina"],
    moduleId: "places",
    parentModuleId: "geography",
    navigationEnabled: (value) => value.showGeography && value.showPlaces,
  },
] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicPathEnabled(
  pathname: string,
  navigation: SiteNavigationGlobal,
  modules?: SiteModulesGlobal,
): boolean {
  const rule = PUBLIC_MODULE_RULES.find((candidate) =>
    candidate.prefixes.some((prefix) => matchesPrefix(pathname, prefix)),
  );
  if (!rule) return true;
  if (!modules) return rule.navigationEnabled(navigation);

  const state = modules.publicModules[rule.moduleId];
  const parentState = rule.parentModuleId
    ? modules.publicModules[rule.parentModuleId]
    : null;
  return Boolean(
    state?.activated &&
      state.published &&
      (!parentState || (parentState.activated && parentState.published)),
  );
}

function isPublicPathDiscoverable(
  pathname: string,
  navigation: SiteNavigationGlobal,
  modules: SiteModulesGlobal,
  field: "includeInSearch" | "includeInSitemap",
): boolean {
  const normalizedPathname = internalPathnameFromHref(pathname) ?? pathname;
  if (!isTravelModulePathEnabled(normalizedPathname, modules)) return false;
  const rule = PUBLIC_MODULE_RULES.find((candidate) =>
    candidate.prefixes.some((prefix) => matchesPrefix(normalizedPathname, prefix)),
  );
  if (!rule) return true;
  if (!isPublicPathEnabled(normalizedPathname, navigation, modules)) return false;
  const state = modules.publicModules[rule.moduleId];
  const parentState = rule.parentModuleId
    ? modules.publicModules[rule.parentModuleId]
    : null;
  return Boolean(state?.[field] && (!parentState || parentState[field]));
}

export function isPublicPathIncludedInSearch(
  pathname: string,
  navigation: SiteNavigationGlobal,
  modules: SiteModulesGlobal,
): boolean {
  return isPublicPathDiscoverable(pathname, navigation, modules, "includeInSearch");
}

export function isPublicPathIncludedInSitemap(
  pathname: string,
  navigation: SiteNavigationGlobal,
  modules: SiteModulesGlobal,
): boolean {
  return isPublicPathDiscoverable(pathname, navigation, modules, "includeInSitemap");
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
  if (matchesPrefix(pathname, "/apartments")) return modules.apartmentsMode === "native_request";
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
    isPublicPathEnabled(pathname, navigation, modules) &&
    (PUBLIC_MODULE_RULES.find((candidate) =>
      candidate.prefixes.some((prefix) => matchesPrefix(pathname, prefix)),
    )?.navigationEnabled(navigation) ?? true) &&
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
