import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { EditorialTheme } from "@/lib/editorial-theme";
import {
  pageBandAccentBlurBottomClass,
  pageBandAccentBlurTopClass,
  pageBandAccentSectionClass,
  pageBandSectionClass,
} from "@/lib/page-band";
import { siteContainerClass } from "@/lib/site-container";
import type { GuidePillarHeroCta } from "@/types/guide-pillar";

type HubHeroEyebrow = {
  label: string;
  href?: string;
};

type HubHeroProps = {
  title: string;
  subtitle?: string;
  image: string;
  imageAlt?: string;
  eyebrow?: HubHeroEyebrow;
  ctas?: GuidePillarHeroCta[];
  searchSlot?: React.ReactNode;
  tone?: "band" | "accent";
  theme?: EditorialTheme;
};

export default function HubHero({
  title,
  subtitle,
  image,
  imageAlt = "",
  eyebrow,
  ctas,
  searchSlot,
  tone = "band",
  theme = "default",
}: HubHeroProps) {
  const accent = tone === "accent";

  return (
    <section
      data-scroll-rail-tone="light"
      data-editorial-theme={theme}
      className={cn(
        accent ? pageBandAccentSectionClass : pageBandSectionClass,
        "editorial-hero",
      )}
    >
      {accent ? (
        <>
          <div className={pageBandAccentBlurTopClass} aria-hidden />
          <div className={pageBandAccentBlurBottomClass} aria-hidden />
        </>
      ) : null}

      <div className={cn(siteContainerClass, "relative py-8 sm:py-10 lg:py-12")}>
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_min(42%,460px)] xl:gap-12">
          <div className="min-w-0">
            {eyebrow ? (
              eyebrow.href ? (
                <Link
                  href={eyebrow.href}
                  className="editorial-kicker group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-white/80"
                >
                  {eyebrow.label}
                  <ArrowUpRight
                    className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              ) : (
                <span className="editorial-kicker inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
                  {eyebrow.label}
                </span>
              )
            ) : null}

            <div className="editorial-rule mt-4 h-1 w-12 rounded-full" aria-hidden />
            <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-[1.08] tracking-[-0.035em] text-charcoal sm:text-4xl lg:text-[2.85rem]">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate sm:text-lg">
                {subtitle}
              </p>
            ) : null}

            {ctas && ctas.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2.5">
                {ctas.map((cta) => (
                  <Link
                    key={cta.href + cta.label}
                    href={cta.href}
                    target={cta.external ? "_blank" : undefined}
                    rel={cta.external ? "noopener noreferrer" : undefined}
                    className={cn(
                      buttonVariants({
                        variant:
                          cta.variant === "primary"
                            ? "default"
                            : cta.variant === "secondary"
                              ? "outline"
                              : "ghost",
                        size: "sm",
                      }),
                      "rounded-full px-5"
                    )}
                  >
                    {cta.label}
                  </Link>
                ))}
              </div>
            ) : null}

            {searchSlot}
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
            <div
              className="pointer-events-none absolute -bottom-4 -left-4 hidden h-[calc(100%-0.75rem)] w-[calc(100%-0.75rem)] rounded-[2rem] border border-[var(--editorial-line)] lg:block"
              aria-hidden
            />
            <div className="editorial-media-frame group relative overflow-hidden rounded-[1.75rem] border bg-charcoal/5">
              <div className="relative aspect-[16/9] w-full sm:aspect-[5/3] lg:aspect-[5/4]">
                <SafeImage
                  src={image}
                  alt={imageAlt}
                  fill
                  priority
                  fetchPriority="high"
                  preferLocalMedia
                  placeholderVariant="destination"
                  sizes="(max-width: 1024px) 100vw, 520px"
                  className="editorial-media-zoom object-cover"
                />
                <div
                  className="editorial-media-overlay absolute inset-0 opacity-70"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white sm:p-6">
                  <p className="max-w-xs text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                    Пора в Аргентину
                  </p>
                  <span className="font-editorial text-3xl italic text-white/90" aria-hidden>
                    AR
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
