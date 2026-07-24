import { Suspense } from "react";
import type { Metadata } from "next";
import ToursCatalog from "@/components/marketplace/ToursCatalog";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import CatalogItemListJsonLd from "@/components/seo/CatalogItemListJsonLd";
import CatalogSeoLinks from "@/components/seo/CatalogSeoLinks";
import CommercialSeoSection from "@/components/seo/CommercialSeoSection";
import { CatalogLoadingFallback } from "@/components/ui/skeleton";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { buildToursCatalogItemListJsonLd } from "@/lib/catalog-json-ld";
import {
  hasCommercialFilterParams,
  IGUAZU_TOURS_SEO,
} from "@/lib/commercial-catalog-seo";
import { getDestinationBySlug, matchToursForDestination } from "@/lib/destinations";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { getPlatformStatsFromMarketplace } from "@/lib/organizer-public";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { filterToursWithResolvedPublicDetail } from "@/lib/public-tour-resolver";

export const dynamic = "force-dynamic";

const PAGE_PATH = "/tours/region/iguazu";
const PAGE_TITLE = "Туры на водопады Игуасу: парк, маршруты и даты";
const PAGE_DESCRIPTION =
  "Туры и программы к водопадам Игуасу: аргентинская сторона, маршруты на несколько дней, даты и условия бронирования без смешения с чисто бразильскими предложениями.";

type IguazuToursPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: IguazuToursPageProps): Promise<Metadata> {
  const query = await searchParams;
  const metadata = buildPublicPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    image: "/media/destinations/iguazu/cover.jpg",
  });

  return {
    ...metadata,
    alternates: {
      ...buildHreflangAlternates(PAGE_PATH),
      ...metadata.alternates,
    },
    ...(hasCommercialFilterParams(query) ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function IguazuToursPage() {
  const locale = await getServerI18nLocale();
  const destination = getDestinationBySlug("iguazu");
  const marketplaceTours = await fetchMarketplaceTours();
  const resolved = await filterToursWithResolvedPublicDetail(marketplaceTours);
  const tours = destination ? matchToursForDestination(resolved, destination) : [];
  const platformStats = getPlatformStatsFromMarketplace(tours);

  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Главная", path: "/" },
          { name: "Туры по Аргентине", path: "/tours" },
          { name: "Туры на Игуасу", path: PAGE_PATH },
        ]}
      />
      <CatalogItemListJsonLd
        data={buildToursCatalogItemListJsonLd(tours, locale, {
          name: "Туры на водопады Игуасу",
          path: PAGE_PATH,
        })}
      />
      <CatalogSeoLinks tours={tours} />
      <Suspense fallback={<CatalogLoadingFallback title="Загружаем туры на Игуасу…" />}>
        <ToursCatalog
          tours={tours}
          platformStats={platformStats}
          catalogBasePath={PAGE_PATH}
          title="Туры на водопады Игуасу"
          subtitle="Сравните программы с аргентинской стороны парка, продолжительность и условия конкретной даты"
          kicker="Мисьонес · Пуэрто-Игуасу"
          heroCaption="Национальный парк Игуасу · Горло Дьявола"
          heroImageAlt="Водопады Игуасу на аргентинской стороне национального парка"
        />
      </Suspense>
      <CommercialSeoSection copy={IGUAZU_TOURS_SEO} />
    </>
  );
}
