"use client";

import Image from "next/image";
import type { ResolvedImage } from "@/lib/image-provider/types";
import { cn } from "@/lib/cn";

interface HomeHeroCollageProps {
  heroSrc: string;
  heroAlt: string;
  showcase: ResolvedImage[];
  className?: string;
}

export default function HomeHeroCollage({
  heroSrc,
  heroAlt,
  showcase,
  className,
}: HomeHeroCollageProps) {
  const secondary = showcase.slice(0, 2);

  return (
    <div className={cn("relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none", className)}>
      <div
        className="pointer-events-none absolute -bottom-3 -left-3 hidden h-[calc(100%-0.75rem)] w-[calc(100%-0.75rem)] rounded-2xl border border-sky/25 lg:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-2 -top-2 hidden h-24 w-24 rounded-full bg-sun/25 blur-2xl lg:block"
        aria-hidden
      />

      <div className="grid grid-cols-12 items-stretch gap-2 sm:gap-2.5">
        <div className="relative col-span-8 overflow-hidden rounded-2xl bg-charcoal/5 shadow-card ring-1 ring-gray-100 sm:col-span-7">
          <div className="relative aspect-[4/5] w-full sm:aspect-[3/4] lg:aspect-[4/5]">
            <Image
              src={heroSrc}
              alt={heroAlt}
              fill
              priority
              sizes="(max-width: 1024px) 55vw, 280px"
              className="object-cover object-[center_35%] sm:object-center"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-charcoal/35 via-transparent to-transparent"
              aria-hidden
            />
          </div>
        </div>

        <div className="col-span-4 grid min-h-0 grid-rows-2 gap-2 sm:col-span-5 sm:gap-2.5">
          {secondary.map((image, index) => (
            <figure
              key={image.src}
              className="group relative min-h-0 overflow-hidden rounded-xl bg-charcoal/5 shadow-sm ring-1 ring-gray-100"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 30vw, 160px"
                className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/10 to-transparent"
                aria-hidden
              />
              <figcaption className="absolute bottom-0 line-clamp-2 p-2 text-[10px] font-medium leading-tight text-white sm:p-2.5 sm:text-xs">
                {image.alt}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
