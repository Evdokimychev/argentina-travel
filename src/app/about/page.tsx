import type { Metadata } from "next";
import AboutPageView from "@/components/about/AboutPageView";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { getPlatformStatsFromMarketplace } from "@/lib/organizer-public";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { getHomeHeroImage } from "@/lib/media-resolver";
import { resolveStaticPageCopy } from "@/lib/static-page-copy";

const PAGE_TITLE_FALLBACK = "О проекте";
const PAGE_DESCRIPTION_FALLBACK =
  "«Пора в Аргентину» — маркетплейс авторских туров по Аргентине. Миссия, ценности и как устроена платформа.";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerI18nLocale();
  const title = resolveStaticPageCopy("about.meta.title", PAGE_TITLE_FALLBACK, locale);
  const description = resolveStaticPageCopy(
    "about.meta.description",
    PAGE_DESCRIPTION_FALLBACK,
    locale
  );

  return {
    ...buildPublicPageMetadata({
      title,
      description,
      path: "/about",
      image: getHomeHeroImage(),
    }),
    alternates: buildHreflangAlternates("/about"),
  };
}

export default async function AboutPage() {
  const locale = await getServerI18nLocale();
  const tours = await fetchMarketplaceTours();
  const platformStats = getPlatformStatsFromMarketplace(tours);
  const pageTitle = resolveStaticPageCopy("about.meta.title", PAGE_TITLE_FALLBACK, locale);
  const pageDescription = resolveStaticPageCopy(
    "about.meta.description",
    PAGE_DESCRIPTION_FALLBACK,
    locale
  );

  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Главная", path: "/" },
          { name: pageTitle, path: "/about" },
        ]}
      />
      <WebPageJsonLd name={pageTitle} description={pageDescription} path="/about" />
      <AboutPageView platformStats={platformStats} />
    </>
  );
}
