import { Suspense } from "react";
import type { Metadata } from "next";
import ExcursionsCatalog from "@/components/excursions/ExcursionsCatalog";
import { CatalogLoadingFallback } from "@/components/ui/skeleton";
import { fetchExcursionsServer } from "@/lib/tripster/excursion-server";

export const metadata: Metadata = {
  title: "Экскурсии по Аргентине",
  description:
    "Городские экскурсии и активности в Буэнос-Айресе, Патагонии и других регионах Аргентины.",
  openGraph: {
    title: "Экскурсии по Аргентине",
    description:
      "Городские экскурсии и активности в Буэнос-Айресе, Патагонии и других регионах Аргентины.",
    type: "website",
  },
  alternates: {
    canonical: "/excursions",
  },
};

export default async function ExcursionsPage() {
  const { items, cities } = await fetchExcursionsServer({ pageSize: 500 });

  return (
    <Suspense fallback={<CatalogLoadingFallback title="Загружаем каталог экскурсий…" />}>
      <ExcursionsCatalog excursions={items} cities={cities} />
    </Suspense>
  );
}
