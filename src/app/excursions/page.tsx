import { Suspense } from "react";
import type { Metadata } from "next";
import ExcursionsCatalog from "@/components/excursions/ExcursionsCatalog";
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
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-24 text-center text-slate">
          Загрузка каталога…
        </div>
      }
    >
      <ExcursionsCatalog excursions={items} cities={cities} />
    </Suspense>
  );
}
