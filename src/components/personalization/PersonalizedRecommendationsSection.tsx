"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import MarketplaceTourCard from "@/components/marketplace/MarketplaceTourCard";
import ExcursionCard from "@/components/excursions/ExcursionCard";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";
import type { TourListing } from "@/types";
import type { ExcursionListing } from "@/types/excursion";

type PersonalizedRecommendationsSectionProps = {
  initialTours?: TourListing[];
  initialExcursions?: ExcursionListing[];
  toursPersonalized?: boolean;
  excursionsPersonalized?: boolean;
  variant?: "homepage" | "profile";
  className?: string;
  fetchOnMount?: boolean;
};

type RecommendationsPayload = {
  tours: TourListing[];
  toursPersonalized?: boolean;
  excursions: ExcursionListing[];
  excursionsPersonalized?: boolean;
};

export default function PersonalizedRecommendationsSection({
  initialTours = [],
  initialExcursions = [],
  toursPersonalized = false,
  excursionsPersonalized = false,
  variant = "homepage",
  className,
  fetchOnMount = false,
}: PersonalizedRecommendationsSectionProps) {
  const [tours, setTours] = useState(initialTours);
  const [excursions, setExcursions] = useState(initialExcursions);
  const [personalized, setPersonalized] = useState(
    toursPersonalized || excursionsPersonalized
  );

  useEffect(() => {
    if (!fetchOnMount) return;

    let cancelled = false;
    void fetch("/api/recommendations?type=all&limit=6")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: RecommendationsPayload | null) => {
        if (cancelled || !payload) return;
        setTours(payload.tours ?? []);
        setExcursions(payload.excursions ?? []);
        setPersonalized(Boolean(payload.toursPersonalized || payload.excursionsPersonalized));
      })
      .catch(() => {
        /* keep SSR snapshot */
      });

    return () => {
      cancelled = true;
    };
  }, [fetchOnMount]);

  if (!tours.length && !excursions.length) return null;

  const subtitle = personalized
    ? "На основе ваших просмотров и избранного"
    : "Популярные маршруты и экскурсии для первого знакомства";

  return (
    <section
      className={cn(
        variant === "homepage"
          ? "border-y border-gray-100 bg-gradient-to-b from-sky/[0.04] to-white py-12 md:py-14"
          : "space-y-5",
        className
      )}
      aria-labelledby="personalized-recommendations-title"
    >
      <div className={variant === "homepage" ? siteContainerClass : undefined}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="personalized-recommendations-title"
              className={cn(
                "font-heading font-bold text-charcoal",
                variant === "homepage" ? "text-2xl md:text-3xl" : "text-lg"
              )}
            >
              Рекомендуем для вас
            </h2>
            <p className="mt-1 text-sm text-slate">{subtitle}</p>
          </div>
          {variant === "homepage" ? (
            <Link
              href="/tours"
              className="inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
            >
              Все туры
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
        </div>

        {tours.length > 0 ? (
          <div
            className={cn(
              "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
              variant === "homepage" ? "mt-8" : "mt-4"
            )}
          >
            {tours.map((tour) => (
              <MarketplaceTourCard key={tour.slug} tour={tour} />
            ))}
          </div>
        ) : null}

        {excursions.length > 0 ? (
          <div className={cn(variant === "homepage" ? "mt-10" : "mt-6")}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-heading text-lg font-bold text-charcoal">Экскурсии рядом с интересами</h3>
              <Link
                href="/excursions"
                className="inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
              >
                Все экскурсии
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {excursions.map((excursion) => (
                <ExcursionCard key={excursion.slug} excursion={excursion} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
