import { Suspense } from "react";
import type { Metadata } from "next";
import ToursCatalog from "@/components/marketplace/ToursCatalog";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import CatalogItemListJsonLd from "@/components/seo/CatalogItemListJsonLd";
import CatalogSeoLinks from "@/components/seo/CatalogSeoLinks";
import CommercialSeoSection from "@/components/seo/CommercialSeoSection";
import { CatalogLoadingFallback } from "@/components/ui/skeleton";
import { fetchMarketplaceToursSafely } from "@/data/marketplace-tours-server";
import { buildToursCatalogItemListJsonLd } from "@/lib/catalog-json-ld";
import {
  hasCommercialFilterParams,
  PATAGONIA_TOURS_SEO,
} from "@/lib/commercial-catalog-seo";
import { getDestinationBySlug, matchToursForDestination } from "@/lib/destinations";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { getPlatformStatsFromMarketplace } from "@/lib/organizer-public";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

const PAGE_PATH = "/tours/region/patagonia";
const PAGE_TITLE = "Туры в Патагонию: треккинг, ледники и маршруты";
const PAGE_DESCRIPTION =
  "Туры в Патагонию: сравните маршруты через Эль-Калафате, Эль-Чальтен, Барилоче и Ушуайю, сложность, продолжительность, даты и условия бронирования.";

type PatagoniaToursPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: PatagoniaToursPageProps): Promise<Metadata> {
  const query = await searchParams;
  const metadata = buildPublicPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    image: "/media/destinations/patagonia/cover.jpg",
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

export default async function PatagoniaToursPage() {
  const locale = await getServerI18nLocale();
  const destination = getDestinationBySlug("patagonia");
  const { tours: allTours, catalogUnavailable } = await fetchMarketplaceToursSafely(
    "patagonia_catalog_unavailable",
  );
  const tours = destination ? matchToursForDestination(allTours, destination) : [];
  const platformStats = getPlatformStatsFromMarketplace(tours);

  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Главная", path: "/" },
          { name: "Туры по Аргентине", path: "/tours" },
          { name: "Туры в Патагонию", path: PAGE_PATH },
        ]}
      />
      <CatalogItemListJsonLd
        data={buildToursCatalogItemListJsonLd(tours, locale, {
          name: "Туры в Патагонию",
          path: PAGE_PATH,
        })}
      />
      <CatalogSeoLinks tours={tours} />
      <Suspense fallback={<CatalogLoadingFallback title="Загружаем туры в Патагонию…" />}>
        <ToursCatalog
          tours={tours}
          platformStats={platformStats}
          catalogUnavailable={catalogUnavailable}
          catalogBasePath={PAGE_PATH}
          title="Туры в Патагонию: ледники, горы и треккинг"
          subtitle="Сравните маршруты по аргентинской Патагонии, продолжительность, сложность и условия конкретной программы"
          kicker="Путешествия по югу Аргентины"
          heroCaption="Эль-Чальтен · Эль-Калафате · Ушуайя"
          heroImageAlt="Горный маршрут и треккинг в аргентинской Патагонии"
        />
      </Suspense>
      <CommercialSeoSection copy={PATAGONIA_TOURS_SEO} />
    </>
  );
}
