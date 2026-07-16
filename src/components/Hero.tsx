import Link from "next/link";
import type { ReactNode } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/cn";
import type { EditorialTheme } from "@/lib/editorial-theme";
import {
  pageBandAccentBlurBottomClass,
  pageBandAccentBlurTopClass,
  pageBandAccentSectionClass,
  pageBandSectionClass,
} from "@/lib/page-band";
import { siteContainerClass } from "@/lib/site-container";

interface HeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  eyebrow?: string;
  ctaText?: string;
  ctaHref?: string;
  compact?: boolean;
  /** `band` — flat gray title strip (default). `accent` — gradient with image (exceptions). */
  tone?: "band" | "accent";
  theme?: EditorialTheme;
  children?: ReactNode;
}

export default function Hero({
  title,
  subtitle,
  description,
  image,
  eyebrow,
  ctaText,
  ctaHref,
  compact = false,
  tone = "band",
  theme = "default",
  children,
}: HeroProps) {
  if (compact) {
    const accent = tone === "accent";
    const editorial = theme !== "default";

    return (
      <section
        data-scroll-rail-tone="light"
        data-editorial-theme={editorial ? theme : undefined}
        className={cn(
          accent ? pageBandAccentSectionClass : pageBandSectionClass,
          editorial && "editorial-hero",
        )}
      >
        {accent ? (
          <>
            <div className={pageBandAccentBlurTopClass} aria-hidden />
            <div className={pageBandAccentBlurBottomClass} aria-hidden />
          </>
        ) : null}

        <div
          className={cn(
            siteContainerClass,
            editorial
              ? "relative py-12 md:py-16 lg:py-20"
              : "relative py-10 md:py-12 lg:py-14",
            children && (editorial ? "pb-10 md:pb-12" : "pb-8 md:pb-10"),
          )}
        >
          <div
            className={cn(
              "hero-compact-grid grid items-center",
              editorial
                ? "gap-9 lg:grid-cols-[minmax(0,1fr)_min(44%,520px)] xl:gap-16"
                : "gap-8 lg:grid-cols-[minmax(0,1fr)_min(38%,320px)] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-12",
            )}
          >
            <div className="min-w-0">
              {eyebrow ? (
                <span
                  className={cn(
                    "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase",
                    editorial
                      ? "editorial-kicker tracking-[0.14em]"
                      : "border-sky/15 bg-sky/5 tracking-wider text-sky",
                  )}
                >
                  {eyebrow}
                </span>
              ) : null}

              {editorial ? (
                <div className="editorial-rule mt-6 h-1 w-12 rounded-full" aria-hidden />
              ) : null}
              <h1
                className={cn(
                  "font-display font-bold text-charcoal",
                  editorial
                    ? "mt-5 max-w-3xl text-4xl leading-[1.06] tracking-[-0.035em] sm:text-5xl lg:text-[3.5rem]"
                    : "max-w-2xl text-3xl leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.65rem]",
                  !editorial && eyebrow && "mt-4",
                )}
              >
                {title}
              </h1>

              {subtitle ? (
                <p
                  className={cn(
                    "text-base text-slate",
                    editorial
                      ? "mt-5 max-w-2xl leading-[1.75] sm:text-lg"
                      : "mt-3 max-w-xl leading-relaxed sm:text-[1.05rem]",
                  )}
                >
                  {subtitle}
                </p>
              ) : null}

              {description ? (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate/90 sm:text-[0.95rem]">
                  {description}
                </p>
              ) : null}

              {ctaText && ctaHref ? (
                <Link
                  href={ctaHref}
                  className="mt-6 inline-flex rounded-full bg-sky px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-dark"
                >
                  {ctaText}
                </Link>
              ) : null}
            </div>

            <div
              className={cn(
                "relative mx-auto w-full lg:mx-0 lg:max-w-none",
                editorial ? "max-w-2xl" : "max-w-md",
              )}
            >
              <div
                className={cn(
                  "pointer-events-none absolute hidden border lg:block",
                  editorial
                    ? "-bottom-4 -left-4 h-[calc(100%-0.75rem)] w-[calc(100%-0.75rem)] rounded-[2rem] border-[var(--editorial-line)]"
                    : "-bottom-3 -left-3 h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)] rounded-2xl border-sky/20",
                )}
                aria-hidden
              />
              <div
                className={cn(
                  "relative overflow-hidden bg-charcoal/5",
                  editorial
                    ? "editorial-media-frame group rounded-[1.75rem] border"
                    : "rounded-2xl shadow-card ring-1 ring-gray-100",
                )}
              >
                <div
                  className={cn(
                    "relative aspect-[16/10] w-full sm:aspect-[5/3]",
                    editorial ? "lg:aspect-[5/4]" : "lg:aspect-[4/3]",
                  )}
                >
                  <SafeImage
                    src={image}
                    alt={title}
                    fill
                    priority
                    fetchPriority="high"
                    preferLocalMedia
                    placeholderVariant="destination"
                    sizes={editorial ? "(max-width: 1024px) 100vw, 520px" : "(max-width: 1024px) 100vw, 360px"}
                    className={cn("object-cover", editorial && "editorial-media-zoom")}
                  />
                  <div
                    className={cn(
                      "absolute inset-0",
                      editorial
                        ? "editorial-media-overlay opacity-70"
                        : "bg-gradient-to-t from-charcoal/25 via-transparent to-transparent",
                    )}
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </div>

          {children ? <div className="mt-8 max-w-4xl lg:max-w-none">{children}</div> : null}
        </div>
      </section>
    );
  }

  return (
    <section
      data-scroll-rail-tone="dark"
      data-editorial-theme={theme !== "default" ? theme : undefined}
      className="relative flex h-[85vh] min-h-[500px] items-end overflow-hidden"
    >
      <SafeImage
        src={image}
        alt={title}
        fill
        priority
        fetchPriority="high"
        preferLocalMedia
        placeholderVariant="destination"
        className="object-cover"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/45 to-charcoal/15"
        aria-hidden
      />
      <div className={cn(siteContainerClass, "relative z-10 pb-14 pt-28 sm:pb-16 sm:pt-32")}>
        {eyebrow ? (
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
            {eyebrow}
          </span>
        ) : null}
        <h1
          className={cn(
            "max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl",
            eyebrow && "mt-4"
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-lg text-white/85 sm:text-xl">{subtitle}</p>
        ) : null}
        {description ? (
          <p className="mt-2 max-w-2xl text-base text-white/70">{description}</p>
        ) : null}
        {ctaText && ctaHref ? (
          <Link
            href={ctaHref}
            className="mt-8 inline-flex rounded-full bg-sun px-8 py-3 text-base font-semibold text-charcoal transition-colors hover:bg-sun-dark"
          >
            {ctaText}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
