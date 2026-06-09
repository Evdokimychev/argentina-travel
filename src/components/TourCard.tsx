"use client";

import Image from "next/image";
import Link from "next/link";
import { Tour } from "@/types";
import FormattedPrice from "@/components/FormattedPrice";

interface TourCardProps {
  tour: Tour;
}

export default function TourCard({ tour }: TourCardProps) {
  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="group card-hover block overflow-hidden rounded-2xl bg-white shadow-md"
    >
      <div className="relative h-52 overflow-hidden">
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-sun px-3 py-1 text-xs font-semibold text-charcoal">
          {tour.region}
        </span>
        <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-patagonia">
          <FormattedPrice priceUsd={tour.priceUsd} />
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3 text-xs text-slate">
          <span>{tour.duration}</span>
          <span>•</span>
          <span>{tour.difficulty}</span>
        </div>
        <h3 className="mt-2 font-display text-lg font-bold text-charcoal transition-colors group-hover:text-sky">
          {tour.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-slate">
          {tour.shortDescription}
        </p>
      </div>
    </Link>
  );
}
