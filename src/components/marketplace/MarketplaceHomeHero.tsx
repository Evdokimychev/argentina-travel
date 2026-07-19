"use client";

import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { siteContainerClass } from "@/lib/site-container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface MarketplaceHomeHeroProps {
  heroCollage?: React.ReactNode;
  searchControls: React.ReactNode;
  filterControls: React.ReactNode;
}

/**
 * Static first-screen frame. It does not depend on tours, flags or the current
 * visitor, so React can flush it while the interactive marketplace data streams.
 */
export default function MarketplaceHomeHero({
  heroCollage,
  searchControls,
  filterControls,
}: MarketplaceHomeHeroProps) {
  const { t } = useLocaleCurrency();

  return (
    <section
      data-scroll-rail-tone="light"
      data-editorial-theme="city"
      className="editorial-hero relative overflow-hidden border-b border-[var(--editorial-line)]"
    >
      <div
        className={cn(
          siteContainerClass,
          "relative py-5 sm:py-8 md:py-9 lg:py-9 xl:py-10",
        )}
      >
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)] lg:gap-x-10 lg:gap-y-6 xl:gap-x-14">
          <div className="relative z-10 order-1 min-w-0 lg:z-auto">
            <span className="editorial-kicker inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] max-lg:!border-white/25 max-lg:!bg-white/10 max-lg:!text-white sm:text-xs sm:tracking-[0.14em]">
              {t("home.hero.eyebrow")}
            </span>
            <div
              className="editorial-rule mt-3 h-1 w-12 rounded-full max-lg:!bg-sky sm:mt-4"
              aria-hidden
            />
            <h1 className="mt-3 max-w-3xl font-display text-[2.1rem] font-bold leading-[1.06] tracking-[-0.03em] text-white sm:mt-4 sm:text-[2.55rem] lg:text-[2.7rem] lg:text-charcoal xl:text-[2.85rem]">
              {t("home.hero.title")} {" "}
              <span className="editorial-accent-text max-lg:!text-sky">
                {t("home.hero.titleAccent")}
              </span>
            </h1>
            <p className="mt-3 line-clamp-2 max-w-xl text-[0.95rem] leading-relaxed text-white/85 sm:mt-4 sm:line-clamp-none sm:text-[1.05rem] lg:text-slate">
              {t("home.hero.subtitle")}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-5">
              <Link
                href="/podbor"
                prefetch={false}
                className={buttonVariants({
                  variant: "default",
                  size: "default",
                  className: "rounded-full gap-2 px-6",
                })}
              >
                <Compass className="h-4 w-4" aria-hidden />
                {t("home.hero.ctaRoute")}
              </Link>
              <Link
                href="/podbor"
                prefetch={false}
                className="hidden items-center gap-1 text-sm font-medium text-white/90 hover:text-white hover:underline sm:inline-flex lg:text-sky-ink"
              >
                {t("home.hero.ctaHint")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          {heroCollage ? (
            <div className="absolute inset-0 z-0 order-3 lg:static lg:inset-auto lg:order-2 lg:block">
              {heroCollage}
            </div>
          ) : null}

          <div className="relative z-10 order-2 lg:order-3 lg:col-span-2 lg:sticky lg:top-[calc(var(--site-header-height,72px)+0.75rem)] lg:z-20">
            {searchControls}
          </div>
        </div>

        {filterControls}
      </div>
    </section>
  );
}
