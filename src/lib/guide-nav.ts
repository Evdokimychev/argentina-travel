import { GUIDE_INDEX_INTRO, GUIDE_TOPICS } from "@/data/guide-topics";
import { guideTopicHref } from "@/lib/guide-topics";
import type { SiteNavColumn, SiteNavLink } from "@/types/site-nav";

export const GUIDE_NAV_PROMO_TITLE = "Путеводитель по Аргентине";

/** Two-line intro shown in the guide mega-menu promo block. */
export const GUIDE_NAV_PROMO_INTRO = GUIDE_INDEX_INTRO;

/** Featured topics in the «Популярное» row. */
export const GUIDE_NAV_FEATURED_SLUGS = [
  "ekonomika-i-dengi",
  "kak-dobratsya",
  "pogoda-i-sezonnost",
] as const;

const GUIDE_PRACTICE_SLUGS = [
  "kak-dobratsya",
  "gde-zhit",
  "transport",
  "svyaz",
  "ekonomika-i-dengi",
  "bezopasnost",
] as const;

const GUIDE_TRAVEL_SLUGS = [
  "turistskie-regiony",
  "dostoprimechatelnosti",
  "pogoda-i-sezonnost",
] as const;

const GUIDE_COUNTRY_SLUGS = ["yazyk", "kultura", "istoriya", "kukhnya", "shopping"] as const;

function guideTopicToNavLink(slug: string): SiteNavLink {
  const topic = GUIDE_TOPICS[slug];
  if (!topic) {
    throw new Error(`Missing guide topic: ${slug}`);
  }
  return {
    id: `guide-${slug}`,
    label: topic.title,
    href: guideTopicHref(slug),
    description: topic.shortDescription,
    topicSlug: slug,
  };
}

export function buildGuideNavLinks(slugs: readonly string[]): SiteNavLink[] {
  return slugs.map(guideTopicToNavLink);
}

export function buildGuideNavColumns(): SiteNavColumn[] {
  return [
    {
      id: "guide-practice",
      title: "Практика",
      titleKey: "nav.columns.guidePractice",
      links: buildGuideNavLinks(GUIDE_PRACTICE_SLUGS),
    },
    {
      id: "guide-travel",
      title: "Путешествие",
      titleKey: "nav.columns.guideTravel",
      links: buildGuideNavLinks(GUIDE_TRAVEL_SLUGS),
    },
    {
      id: "guide-country",
      title: "Страна",
      titleKey: "nav.columns.guideCountry",
      links: buildGuideNavLinks(GUIDE_COUNTRY_SLUGS),
    },
  ];
}

export function buildGuideFeaturedLinks(): SiteNavLink[] {
  return buildGuideNavLinks(GUIDE_NAV_FEATURED_SLUGS);
}
