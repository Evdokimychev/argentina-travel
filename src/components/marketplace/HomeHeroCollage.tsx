import { SafeImage } from "@/components/ui/safe-image";
import type { ResolvedImage } from "@/lib/image-provider/types";
import { cn } from "@/lib/cn";

const MOBILE_HERO_SRC = "/media/home/hero-mobile.webp";

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
    <div
      data-editorial-theme="city"
      className={cn("relative h-full w-full lg:mx-0 lg:h-auto lg:max-w-none", className)}
    >
      <div
        className="pointer-events-none absolute -bottom-5 -left-5 hidden h-[calc(100%-1rem)] w-[calc(100%-1rem)] rounded-panel border border-[var(--editorial-line)] lg:block"
        aria-hidden
      />
      <div className="grid h-full grid-cols-12 items-stretch gap-2.5 sm:gap-3 lg:h-auto">
        <figure className="editorial-media-frame group relative col-span-12 h-full overflow-hidden border-0 bg-charcoal/5 lg:h-auto lg:rounded-panel lg:border sm:col-span-12 lg:col-span-8">
          <div className="relative h-full w-full lg:aspect-square lg:h-auto">
            <picture>
              <source media="(max-width: 1023px)" srcSet={MOBILE_HERO_SRC} />
              {/* The production image pipeline is intentionally unoptimized, so
                  the picture source preserves a purpose-built mobile crop while
                  the desktop fallback keeps its wider composition. */}
              <img
                src={heroSrc}
                alt={heroAlt}
                fetchPriority="high"
                loading="eager"
                decoding="async"
                className="editorial-media-zoom absolute inset-0 h-full w-full object-cover object-[62%_center] motion-reduce:transform-none lg:object-center"
              />
            </picture>
            <div
              className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(10_24_36/0.48),rgb(10_24_36/0.76)_52%,rgb(10_24_36/0.94))] lg:editorial-media-overlay"
              aria-hidden
            />
            <figcaption
              aria-hidden
              className="absolute inset-x-0 bottom-0 hidden items-end justify-between gap-3 p-5 text-white lg:flex lg:p-6"
            >
              <span className="max-w-[75%] text-xs font-semibold uppercase leading-relaxed tracking-[0.14em] text-white/85">
                {heroAlt}
              </span>
              <span className="font-editorial text-3xl italic text-white/90" aria-hidden>
                01
              </span>
            </figcaption>
          </div>
        </figure>

        <div className="col-span-4 hidden min-h-0 grid-rows-2 gap-3 lg:grid">
          {secondary.map((image, index) => (
            <figure
              key={image.src}
              className="editorial-media-frame group relative min-h-0 overflow-hidden rounded-card border bg-charcoal/5"
            >
              <div className="relative h-full min-h-[10rem] w-full">
                <SafeImage
                  src={image.src}
                  alt=""
                  fill
                  loading="lazy"
                  preferLocalMedia
                  placeholderVariant="destination"
                  sizes="(max-width: 1024px) 30vw, 220px"
                  className="editorial-media-zoom object-cover motion-reduce:transform-none"
                />
              </div>
              <div
                className="editorial-media-overlay absolute inset-0"
                aria-hidden
              />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-3 pb-3 pt-8 sm:px-4 sm:pb-4">
                <span className="line-clamp-3 block text-[10px] font-semibold uppercase leading-relaxed tracking-[0.1em] text-white/90 sm:text-[11px]">
                  {image.alt}
                </span>
                <span className="font-editorial text-xl italic text-white/80" aria-hidden>
                  0{index + 2}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
