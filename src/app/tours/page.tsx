import { Suspense } from "react";
import type { Metadata } from "next";
import ToursCatalog from "@/components/marketplace/ToursCatalog";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import CatalogSeoLinks from "@/components/seo/CatalogSeoLinks";
import { CatalogLoadingFallback } from "@/components/ui/skeleton";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { buildCatalogMetadata, getServerCatalogView } from "@/lib/catalog-seo";

type ToursPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: ToursPageProps): Promise<Metadata> {
  const params = await searchParams;
  const tours = await fetchMarketplaceTours();
  return buildCatalogMetadata(params, tours);
}

export default async function ToursPage({ searchParams }: ToursPageProps) {
  const params = await searchParams;
  const tours = await fetchMarketplaceTours();
  const view = getServerCatalogView(params, tours);

  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Главная", path: "/" },
          { name: "Каталог туров по Аргентине", path: "/tours" },
        ]}
      />
      <CatalogSeoLinks tours={view.filtered} />
      <Suspense fallback={<CatalogLoadingFallback title="Загружаем каталог туров…" />}>
        <ToursCatalog tours={tours} />
      </Suspense>
    </>
  );
}
