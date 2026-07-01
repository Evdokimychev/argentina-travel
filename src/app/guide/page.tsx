import type { Metadata } from "next";
import GuideHubView from "@/components/guide/GuideHubView";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { resolveLocaleBreadcrumbItems } from "@/lib/locale-breadcrumbs";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { resolveStaticPageCopy } from "@/lib/static-page-copy";

const PAGE_TITLE_FALLBACK = "Путеводитель по Аргентине";
const PAGE_DESCRIPTION_FALLBACK =
  "14 тем для планирования поездки: перелёты, регионы, деньги, культура и безопасность — с турами, сервисами и FAQ.";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerI18nLocale();
  const title = resolveStaticPageCopy("guide.hub.meta.title", PAGE_TITLE_FALLBACK, locale);
  const description = resolveStaticPageCopy(
    "guide.hub.meta.description",
    PAGE_DESCRIPTION_FALLBACK,
    locale,
  );

  return {
    ...buildPublicPageMetadata({
      title,
      description,
      path: "/guide",
      image: getServicePageHeroImage("guide-hub"),
    }),
    alternates: buildHreflangAlternates("/guide"),
  };
}

export default async function GuidePage() {
  const locale = await getServerI18nLocale();
  const breadcrumbItems = resolveLocaleBreadcrumbItems(locale, [
    { labelKey: "nav.home", path: "/", fallback: "Главная" },
    { labelKey: "nav.guide", path: "/guide", fallback: PAGE_TITLE_FALLBACK },
  ]);

  return (
    <>
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <GuideHubView />
    </>
  );
}
