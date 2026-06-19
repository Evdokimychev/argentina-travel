"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import TourPublicPriceDisplay from "@/components/tour-detail/TourPublicPriceDisplay";
import { SafeImage } from "@/components/ui/safe-image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatDurationShort } from "@/lib/pluralize";
import type { MatchedTourResult } from "@/types/tour-match";

interface PodborMatchedTourCardProps {
  match: MatchedTourResult;
  className?: string;
}

export default function PodborMatchedTourCard({ match, className }: PodborMatchedTourCardProps) {
  const { tour, explanation } = match;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card",
        className
      )}
    >
      <div className="grid gap-0 sm:grid-cols-[9rem_1fr]">
        <div className="relative aspect-[4/3] sm:aspect-auto sm:min-h-[9rem]">
          <SafeImage
            src={tour.image}
            alt={tour.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 144px"
          />
        </div>

        <div className="flex flex-col gap-3 p-4 sm:p-5">
          <div>
            <h3 className="font-heading text-lg font-bold leading-snug text-charcoal">
              {tour.title}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {tour.region || tour.destination}
              </span>
              <span>{formatDurationShort(tour.durationDays, tour.durationNights)}</span>
              <TourPublicPriceDisplay
                priceUsd={tour.priceUsd}
                priceOnRequest={tour.priceOnRequest}
                priceFromPrefix={tour.priceFromPrefix}
                size="sm"
                density="compact"
                className="text-xs font-semibold text-charcoal"
              />
            </div>
          </div>

          <div className="rounded-xl bg-sky/5 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky">Почему этот тур</p>
            <p className="mt-1 text-sm leading-relaxed text-slate">{explanation}</p>
          </div>

          <Link
            href={`/tours/${tour.slug}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
          >
            Открыть тур
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
