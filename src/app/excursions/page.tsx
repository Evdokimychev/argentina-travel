import { Suspense } from "react";
import type { Metadata } from "next";
import ExcursionsCatalog from "@/components/excursions/ExcursionsCatalog";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import { CatalogLoadingFallback } from "@/components/ui/skeleton";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { fetchExcursionsServer } from "@/lib/tripster/excursion-server";

const PAGE_TITLE = "Экскурсии по Аргентине";
const PAGE_DESCRIPTION =
  "Городские экскурсии и активности в Буэнос-Айресе, Патагонии и других регионах Аргентины.";

export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/excursions",
  }),
  alternates: buildHreflangAlternates("/excursions"),
};

export default async function ExcursionsPage() {
  const { items, cities } = await fetchExcursionsServer({ pageSize: 500 });

  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Главная", path: "/" },
          { name: PAGE_TITLE, path: "/excursions" },
        ]}
      />
      <Suspense fallback={<CatalogLoadingFallback title="Загружаем каталог экскурсий…" />}>
        <ExcursionsCatalog
          excursions={items}
          cities={cities}
          title="Экскурсии"
          subtitle="Городские маршруты и активности по Аргентине"
        />
      </Suspense>
    </>
  );
}
