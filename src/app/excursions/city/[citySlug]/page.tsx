import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ExcursionsCatalog from "@/components/excursions/ExcursionsCatalog";
import ExcursionCityFlightSidebar from "@/components/flights/ExcursionCityFlightSidebar";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import CatalogItemListJsonLd from "@/components/seo/CatalogItemListJsonLd";
import CommercialSeoSection from "@/components/seo/CommercialSeoSection";
import { CatalogLoadingFallback } from "@/components/ui/skeleton";
import { getExcursionCityFlightRouteIds } from "@/lib/flights/destination-airports";
import {
  fetchExcursionCityServer,
  fetchExcursionsServer,
} from "@/lib/tripster/excursion-server";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { buildExcursionsCatalogItemListJsonLd } from "@/lib/catalog-json-ld";
import {
  getExcursionCitySearchCopy,
  getExcursionCitySeoCopy,
  hasCommercialFilterParams,
} from "@/lib/commercial-catalog-seo";

type CityPageProps = {
  params: Promise<{ citySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: CityPageProps): Promise<Metadata> {
  const { citySlug } = await params;
  const query = await searchParams;
  const city = await fetchExcursionCityServer(citySlug);
  if (!city) return { title: "Город не найден" };

  const copy = getExcursionCitySearchCopy(citySlug, city.name);
  const metadata = buildPublicPageMetadata({
    title: copy.metadataTitle,
    description: copy.metadataDescription,
    path: `/excursions/city/${citySlug}`,
  });

  return {
    ...metadata,
    ...(hasCommercialFilterParams(query) ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ExcursionCityPage({ params }: CityPageProps) {
  const { citySlug } = await params;
  const city = await fetchExcursionCityServer(citySlug);
  if (!city) notFound();

  const { items, cities } = await fetchExcursionsServer({
    citySlug,
    pageSize: 500,
  });

  const hasFlightRoutes = getExcursionCityFlightRouteIds(citySlug).length > 0;
  const searchCopy = getExcursionCitySearchCopy(citySlug, city.name);
  const seoCopy = getExcursionCitySeoCopy(citySlug, city.name);
  const flightSidebar = hasFlightRoutes ? (
    <ExcursionCityFlightSidebar citySlug={citySlug} cityName={city.name} />
  ) : null;

  const path = `/excursions/city/${citySlug}`;

  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Главная", path: "/" },
          { name: "Экскурсии", path: "/excursions" },
          { name: searchCopy.heading, path },
        ]}
      />
      <CatalogItemListJsonLd
        data={buildExcursionsCatalogItemListJsonLd(items, {
          name: searchCopy.heading,
          path,
        })}
      />
      <Suspense fallback={<CatalogLoadingFallback title="Загружаем экскурсии…" />}>
        <ExcursionsCatalog
          excursions={items}
          cities={cities}
          initialCitySlug={citySlug}
          title={searchCopy.heading}
          subtitle={`${searchCopy.subtitle}. Предложений в каталоге: ${city.experienceCount}`}
          flightSidebar={flightSidebar}
        />
      </Suspense>
      <CommercialSeoSection copy={seoCopy} />
    </>
  );
}
