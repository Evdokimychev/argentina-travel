import type { Metadata } from "next";
import ImmigrationHubView from "@/components/immigration/ImmigrationHubView";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { resolveLocaleBreadcrumbItems } from "@/lib/locale-breadcrumbs";
import { getImmigrationHubHeroImage } from "@/lib/media-resolver";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { resolveStaticPageCopy } from "@/lib/static-page-copy";

const PAGE_TITLE_FALLBACK = "Иммиграция в Аргентину — ВНЖ, гражданство, RADEX";
const PAGE_DESCRIPTION_FALLBACK =
  "Полный справочник по иммиграции: 15 оснований ВНЖ, путь к гражданству, Decreto 366/2025, RADEX, документы и FAQ. Справочно, без юридических гарантий.";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerI18nLocale();
  const title = resolveStaticPageCopy("immigration.hub.meta.title", PAGE_TITLE_FALLBACK, locale);
  const description = resolveStaticPageCopy(
    "immigration.hub.meta.description",
    PAGE_DESCRIPTION_FALLBACK,
    locale,
  );

  return {
    ...buildPublicPageMetadata({
      title,
      description,
      path: "/immigration",
      image: getImmigrationHubHeroImage(),
    }),
    alternates: buildHreflangAlternates("/immigration"),
  };
}

export default async function ImmigrationPage() {
  const locale = await getServerI18nLocale();
  const breadcrumbItems = resolveLocaleBreadcrumbItems(locale, [
    { labelKey: "nav.home", path: "/", fallback: "Главная" },
    { labelKey: "nav.immigration", path: "/immigration", fallback: "Иммиграция" },
  ]);

  return (
    <>
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <ImmigrationHubView />
    </>
  );
}
