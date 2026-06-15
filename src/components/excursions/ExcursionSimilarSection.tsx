"use client";

import Link from "next/link";
import ExcursionCard from "@/components/excursions/ExcursionCard";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import type { ExcursionListing } from "@/types/excursion";

type ExcursionSimilarSectionProps = {
  excursions: ExcursionListing[];
  cityName?: string;
};

export default function ExcursionSimilarSection({
  excursions,
  cityName,
}: ExcursionSimilarSectionProps) {
  const { t } = useLocaleCurrency();

  if (!excursions.length) return null;

  const subtitle = cityName
    ? t("excursions.similar.subtitleCity").replace("{city}", cityName)
    : t("excursions.similar.subtitle");

  return (
    <section id="similar" className="mt-12 border-t border-gray-100 pt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-charcoal">
            {t("excursions.similar.title")}
          </h2>
          <p className="mt-1 text-sm text-slate">{subtitle}</p>
        </div>
        <Link
          href="/excursions"
          className="text-sm font-medium text-sky hover:underline"
        >
          {t("excursions.backToAll")}
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {excursions.map((excursion) => (
          <ExcursionCard key={excursion.id} excursion={excursion} />
        ))}
      </div>
    </section>
  );
}
