import {
  SITE_NAV_GUIDE_ABOUT_HREF,
  SITE_NAV_GUIDE_INTRO,
  SITE_NAV_GUIDE_TOPICS,
  type SiteNavGuideTopicSlug,
} from "@/data/site-nav-guide-topics";
import { GUIDE_ABOUT_LINK_ID, GUIDE_HUB_LINK_ID } from "@/lib/guide-nav-icons";
import type { SiteNavColumn, SiteNavLink } from "@/types/site-nav";

export const GUIDE_NAV_PROMO_TITLE = "Путеводитель по Аргентине";

/** Two-line intro shown in the guide mega-menu promo block. */
export const GUIDE_NAV_PROMO_INTRO = SITE_NAV_GUIDE_INTRO;

/** Featured topics in the «Популярное» row. */
export const GUIDE_NAV_FEATURED_SLUGS = [
  "ekonomika-i-dengi",
  "kak-dobratsya",
  "pogoda-i-sezonnost",
] as const;

/** First link in mega-menu promo row */
export const GUIDE_NAV_ABOUT_HREF = SITE_NAV_GUIDE_ABOUT_HREF;

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

function guideTopicToNavLink(slug: SiteNavGuideTopicSlug): SiteNavLink {
  const topic = SITE_NAV_GUIDE_TOPICS[slug];
  return {
    id: `guide-${slug}`,
    label: topic.title,
    href: `/guide/${slug}`,
    description: topic.shortDescription,
    topicSlug: slug,
  };
}

export function buildGuideNavLinks(slugs: readonly SiteNavGuideTopicSlug[]): SiteNavLink[] {
  return slugs.map(guideTopicToNavLink);
}

export function buildGuideNavColumns(): SiteNavColumn[] {
  return [
    {
      id: "guide-practice",
      title: "Практика",
      titleKey: "nav.columns.guidePractice",
      links: [
        {
          id: GUIDE_ABOUT_LINK_ID,
          label: "Об Аргентине",
          href: SITE_NAV_GUIDE_ABOUT_HREF,
          description: "Страна, регионы, маршруты — главная страница путеводителя",
        },
        {
          id: GUIDE_HUB_LINK_ID,
          label: "Все темы",
          href: "/guide",
          description: "14 тем: практика, регионы, культура и деньги",
        },
        ...buildGuideNavLinks(GUIDE_PRACTICE_SLUGS),
      ],
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
