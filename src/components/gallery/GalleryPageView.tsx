"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ArrowRight, MapPin, X } from "lucide-react";
import Hero from "@/components/Hero";
import { useSiteHeaderOverlayLock } from "@/hooks/useSiteHeaderOverlayLock";
import {
  GALLERY_REGIONS,
  galleryItems,
  type GalleryItem,
} from "@/data/gallery-items";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

interface GalleryPageViewProps {
  initialRegion?: string;
}

export default function GalleryPageView({ initialRegion }: GalleryPageViewProps) {
  const [activeRegion, setActiveRegion] = useState<string | null>(
    initialRegion && GALLERY_REGIONS.some((r) => r.slug === initialRegion) ? initialRegion : null
  );
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  useSiteHeaderOverlayLock(lightboxItem != null);

  const filteredItems = useMemo(
    () =>
      activeRegion
        ? galleryItems.filter((item) => item.regionSlug === activeRegion)
        : galleryItems,
    [activeRegion]
  );

  const selectRegion = useCallback((slug: string | null) => {
    setActiveRegion(slug);
    const url = slug ? `/gallery?region=${slug}` : "/gallery";
    window.history.replaceState(null, "", url);
  }, []);

  return (
    <>
      <Hero
        title="Галерея Аргентины"
        subtitle="Фото из авторских туров — Патагония, вино, танго и природные чудеса"
        image={getServicePageHeroImage("gallery")}
        compact
      />

      <section className={siteContainerClass + " py-12 sm:py-16"}>
        <div className="max-w-2xl">
          <p className="text-base leading-relaxed text-slate">
            Подборка снимков из каталога туров. Каждое фото ведёт к маршруту организатора — можно
            забронировать или оставить заявку.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectRegion(null)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activeRegion === null
                ? "bg-sky text-white"
                : "border border-gray-200 bg-white text-charcoal hover:border-sky/40 hover:text-sky"
            )}
          >
            Все регионы
          </button>
          {GALLERY_REGIONS.map((region) => (
            <button
              key={region.slug}
              type="button"
              onClick={() => selectRegion(region.slug)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                activeRegion === region.slug
                  ? "bg-sky text-white"
                  : "border border-gray-200 bg-white text-charcoal hover:border-sky/40 hover:text-sky"
              )}
            >
              {region.label}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <p className="mt-10 text-slate">В этом регионе пока нет фотографий.</p>
        ) : (
          <div className="mt-10 columns-2 gap-4 sm:columns-3 lg:columns-4">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLightboxItem(item)}
                className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-shadow hover:shadow-elevated"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-left opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="flex items-center gap-1 text-xs text-white/80">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {item.destination}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm font-medium text-white">
                      {item.title}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {lightboxItem ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={lightboxItem.title}
        >
          <button
            type="button"
            onClick={() => setLightboxItem(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-charcoal shadow-elevated">
            <div className="relative aspect-[16/10] max-h-[70vh] w-full">
              <Image
                src={lightboxItem.imageUrl}
                alt={lightboxItem.title}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            <div className="flex flex-col gap-3 border-t border-white/10 bg-charcoal p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-heading text-lg font-bold text-white">{lightboxItem.title}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-300">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {lightboxItem.destination} · {lightboxItem.region}
                </p>
              </div>
              <Link
                href={`/tours/${lightboxItem.tourSlug}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-sky px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky/90"
              >
                Смотреть тур
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
