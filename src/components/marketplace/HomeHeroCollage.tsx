import { SafeImage } from "@/components/ui/safe-image";
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
    <div
      data-editorial-theme="city"
      className={cn("relative mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-none", className)}
    >
      <div
        className="pointer-events-none absolute -bottom-5 -left-5 hidden h-[calc(100%-1rem)] w-[calc(100%-1rem)] rounded-[2rem] border border-[var(--editorial-line)] lg:block"
        aria-hidden
      />
      <div className="grid grid-cols-12 items-stretch gap-2.5 sm:gap-3">
        <figure className="editorial-media-frame group relative col-span-12 overflow-hidden rounded-[1.75rem] border bg-charcoal/5 sm:col-span-8">
          <div className="relative aspect-[16/11] w-full sm:aspect-[4/5] lg:aspect-square">
            <SafeImage
              src={heroSrc}
              alt=""
              fill
              priority
              fetchPriority="high"
              preferLocalMedia
              placeholderVariant="destination"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 62vw, 430px"
              className="editorial-media-zoom object-cover object-[center_35%] motion-reduce:transform-none sm:object-center"
            />
            <div
              className="editorial-media-overlay absolute inset-0"
              aria-hidden
            />
            <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white sm:p-6">
              <span className="max-w-[75%] text-xs font-semibold uppercase leading-relaxed tracking-[0.14em] text-white/85">
                {heroAlt}
              </span>
              <span className="font-editorial text-3xl italic text-white/90" aria-hidden>
                01
              </span>
            </figcaption>
          </div>
        </figure>

        <div className="col-span-4 hidden min-h-0 grid-rows-2 gap-3 sm:grid">
          {secondary.map((image, index) => (
            <figure
              key={image.src}
              className="editorial-media-frame group relative min-h-0 overflow-hidden rounded-[1.35rem] border bg-charcoal/5"
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
