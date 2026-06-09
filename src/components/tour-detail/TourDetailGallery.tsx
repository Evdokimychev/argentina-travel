"use client";

import Image from "next/image";
import { useState } from "react";

interface TourDetailGalleryProps {
  images: string[];
  title: string;
}

function GalleryTile({
  src,
  alt,
  className,
  priority,
  onClick,
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-gray-100 ${className ?? ""}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-500 hover:scale-105"
        sizes="(max-width: 768px) 50vw, 40vw"
        priority={priority}
      />
      {children}
    </button>
  );
}

export default function TourDetailGallery({ images, title }: TourDetailGalleryProps) {
  const [lightbox, setLightbox] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [main, ...rest] = images;
  const side = rest.slice(0, 4);

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setLightbox(true);
  };

  return (
    <>
      {/* Desktop */}
      <div className="hidden gap-2 md:grid md:grid-cols-4 md:grid-rows-2 md:h-[480px]">
        <GalleryTile
          src={main}
          alt={title}
          className="col-span-2 row-span-2"
          priority
          onClick={() => openLightbox(0)}
        />
        {side.map((src, i) => (
          <GalleryTile
            key={src}
            src={src}
            alt={`${title} — ${i + 2}`}
            onClick={() => openLightbox(i + 1)}
          >
            {i === side.length - 1 && images.length > 5 && (
              <span className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-charcoal shadow-md">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Показать все ({images.length})
              </span>
            )}
          </GalleryTile>
        ))}
      </div>

      {/* Mobile */}
      <div className="relative h-64 overflow-hidden rounded-2xl sm:h-80 md:hidden">
        <Image src={main} alt={title} fill className="object-cover" priority sizes="100vw" />
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="absolute bottom-3 right-3 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-md"
        >
          Все фото ({images.length})
        </button>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-charcoal/95"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm">
              {activeIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
              Закрыть
            </button>
          </div>
          <div className="relative flex-1">
            <Image
              src={images[activeIndex]}
              alt={`${title} — ${activeIndex + 1}`}
              fill
              className="object-contain p-4"
              sizes="100vw"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto p-4">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ${i === activeIndex ? "ring-2 ring-sun" : ""}`}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
