"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, X } from "lucide-react";
import type { MapObject } from "@/lib/map-types";
import { cn } from "@/lib/cn";

type Props = {
  object: MapObject;
  onClose: () => void;
  className?: string;
};

export default function MapObjectCard({ object, onClose, className }: Props) {
  return (
    <article
      className={cn(
        "w-full max-w-sm overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-elevated",
        className
      )}
    >
      {object.image ? (
        <div className="relative aspect-[16/10] bg-gray-100">
          <Image src={object.image} alt="" fill className="object-cover" sizes="320px" />
        </div>
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-sky/10 to-white">
          <MapPin className="h-10 w-10 text-sky/60" aria-hidden />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky">{object.region}</p>
            <h2 className="mt-1 font-heading text-lg font-bold text-charcoal">{object.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate hover:bg-gray-100"
            aria-label="Закрыть карточку"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {object.description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate">{object.description}</p>
        ) : null}

        {object.relatedTours && object.relatedTours.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate">Экскурсии</p>
            <ul className="mt-2 space-y-1.5">
              {object.relatedTours.slice(0, 3).map((tour) => (
                <li key={tour.href}>
                  <Link href={tour.href} className="text-sm font-medium text-sky hover:underline">
                    {tour.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {object.relatedArticles && object.relatedArticles.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate">Материалы</p>
            <ul className="mt-2 space-y-1.5">
              {object.relatedArticles.slice(0, 3).map((article) => (
                <li key={article.href}>
                  <Link href={article.href} className="text-sm text-charcoal hover:text-sky hover:underline">
                    {article.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Link
          href={object.href}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-sky px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-dark"
        >
          Подробнее
        </Link>
      </div>
    </article>
  );
}
