import type { ItemList, WithContext } from "schema-dts";
import { SITE_NAV_SECTIONS } from "@/data/site-nav";
import { absoluteUrl } from "@/lib/site-url";
import { filterSiteNavSections } from "@/lib/public-module-visibility";
import type { SiteNavigationGlobal } from "@/types/site-globals";

/** Primary public hubs — aligned with header navigation (Yandex quick links signals). */
export const HOME_PRIMARY_SECTION_IDS = [
  "geography",
  "tours",
  "excursions",
  "guide",
  "immigration",
  "journal",
] as const;

const HOME_PRIMARY_EXTRA_LINKS = [
  { id: "faq", name: "Частые вопросы", path: "/faq" },
] as const;

function resolveNavSectionLink(
  id: string,
  sections = SITE_NAV_SECTIONS,
): { name: string; path: string } | null {
  const section = sections.find((item) => item.id === id);
  if (!section?.href) return null;
  return { name: section.label, path: section.href };
}

export function getHomePrimarySectionLinks(
  navigation?: SiteNavigationGlobal,
): Array<{ name: string; path: string }> {
  const sections = navigation
    ? filterSiteNavSections(SITE_NAV_SECTIONS, navigation)
    : SITE_NAV_SECTIONS;
  const fromNav = HOME_PRIMARY_SECTION_IDS.map((id) =>
    resolveNavSectionLink(id, sections),
  ).filter(
    (link): link is { name: string; path: string } => Boolean(link),
  );
  return [...fromNav, ...HOME_PRIMARY_EXTRA_LINKS];
}

/** ItemList of main site sections on the homepage — helps crawlers map site structure. */
export function buildHomePrimarySectionsItemListJsonLd(
  siteName: string,
  navigation?: SiteNavigationGlobal,
): WithContext<ItemList> {
  const links = getHomePrimarySectionLinks(navigation);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${siteName} — основные разделы`,
    url: absoluteUrl("/"),
    numberOfItems: links.length,
    itemListElement: links.map((link, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "WebPage",
        name: link.name,
        url: absoluteUrl(link.path),
      },
    })),
  };
}

/** Hub paths always included in sitemap — key entry points for Yandex indexing. */
export const YANDEX_PRIORITY_HUB_PATHS = [
  "/",
  "/destinations",
  "/tours",
  "/excursions",
  "/guide",
  "/immigration",
  "/blog",
  "/faq",
  "/about",
  "/contacts",
  "/flights",
  "/places",
  "/baza-znaniy",
] as const;
