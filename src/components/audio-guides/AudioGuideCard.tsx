"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Star } from "lucide-react";
import { buildAudioGuideDetailPath } from "@/lib/wegottrip/paths";
import type { WeGoTripProductSummary } from "@/lib/wegottrip/types";
import { cn } from "@/lib/utils";

type AudioGuideCardProps = {
  product: WeGoTripProductSummary;
  bookLabel: string;
  fromLabel: string;
  className?: string;
};

function formatPrice(product: WeGoTripProductSummary): string {
  if (product.price <= 0) return "—";
  const amount = Number.isInteger(product.price) ? String(product.price) : product.price.toFixed(2);
  return `${product.currencySymbol}${amount}`;
}

export default function AudioGuideCard({ product, bookLabel, fromLabel, className }: AudioGuideCardProps) {
  const detailHref = buildAudioGuideDetailPath(product.id);
  const bookHref = `/api/affiliate/audio-guides/book?productId=${product.id}&checkout=1`;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:border-sky/25 hover:shadow-elevated",
        className
      )}
    >
      <Link href={detailHref} className="relative block aspect-[16/10] overflow-hidden bg-surface-muted">
        {product.preview ? (
          <Image
            src={product.preview}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate">
          {product.city.name ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {product.city.name}
            </span>
          ) : null}
          {product.duration ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {product.duration}
            </span>
          ) : null}
          {product.rating != null && product.reviewsCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-sun text-sun" aria-hidden />
              {product.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <h3 className="mt-2 line-clamp-2 font-heading text-base font-bold text-charcoal group-hover:text-sky">
          <Link href={detailHref}>{product.title}</Link>
        </h3>

        {product.category ? (
          <p className="mt-1 text-xs uppercase tracking-wide text-slate">{product.category}</p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="text-xs text-slate">{fromLabel}</p>
            <p className="font-heading text-xl font-bold text-charcoal">{formatPrice(product)}</p>
          </div>
          <a
            href={bookHref}
            className="inline-flex shrink-0 rounded-full bg-sky px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-dark"
          >
            {bookLabel}
          </a>
        </div>
      </div>
    </article>
  );
}
