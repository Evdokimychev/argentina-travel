"use client";

import Link from "next/link";
import { ArrowUpRight, Compass, Shield, Users } from "lucide-react";
import PlatformStatsBlock from "@/components/marketplace/PlatformStatsBlock";
import { Button, buttonVariants } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { siteContainerClass } from "@/lib/site-container";
import type { PlatformStats } from "@/lib/organizer-public";
import { cn } from "@/lib/cn";

interface AboutPageViewProps {
  platformStats: PlatformStats;
}

const VALUE_KEYS = [
  {
    icon: Compass,
    titleKey: "about.value.travelers.title",
    textKey: "about.value.travelers.text",
  },
  {
    icon: Users,
    titleKey: "about.value.organizers.title",
    textKey: "about.value.organizers.text",
  },
  {
    icon: Shield,
    titleKey: "about.value.trust.title",
    textKey: "about.value.trust.text",
  },
] as const;

const EXPLORE_LINKS = [
  { href: "/places", titleKey: "about.explore.places.title", textKey: "about.explore.places.text" },
  { href: "/guide", titleKey: "about.explore.guide.title", textKey: "about.explore.guide.text" },
  {
    href: "/immigration",
    titleKey: "about.explore.immigration.title",
    textKey: "about.explore.immigration.text",
  },
] as const;

export default function AboutPageView({ platformStats }: AboutPageViewProps) {
  const { t } = useLocaleCurrency();

  return (
    <>
      {/* Hero */}
      <section
        data-editorial-theme="city"
        className="editorial-hero relative overflow-hidden py-10 sm:py-14 lg:py-16"
      >
        <div className={cn(siteContainerClass, "relative grid items-center gap-10 lg:grid-cols-[minmax(0,1.03fr)_minmax(420px,.97fr)] lg:gap-14")}>
          <div>
            <p className="editorial-kicker inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
              {t("about.hero.eyebrow")}
            </p>
            <div className="editorial-rule mt-6 h-1 w-12 rounded-full" aria-hidden />
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.06] tracking-[-0.035em] text-charcoal sm:text-5xl lg:text-[3.6rem]">
              {t("about.hero.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-[1.75] text-slate sm:text-lg">{t("about.hero.subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/tours" className={buttonVariants({ size: "lg" })}>
                {t("about.hero.ctaTours")}
              </Link>
              <Link href="/contacts" className={buttonVariants({ variant: "outline", size: "lg" })}>
                {t("about.hero.ctaContact")}
              </Link>
            </div>
          </div>

          <div className="relative min-h-[290px] sm:min-h-[360px] lg:min-h-[430px]" aria-label="Аргентина — города и природа">
            <div className="editorial-media-frame absolute left-0 top-0 h-[84%] w-[76%] overflow-hidden rounded-[1.75rem] border bg-charcoal/5 shadow-elevated">
              <SafeImage
                src="/media/home/showcase-ba.jpg"
                alt="Буэнос-Айрес — город, с которого начинается знакомство с Аргентиной"
                fill
                priority
                placeholderVariant="destination"
                className="object-cover"
                sizes="(max-width: 1024px) 76vw, 420px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/35 via-transparent to-transparent" aria-hidden />
            </div>
            <div className="editorial-media-frame absolute bottom-0 right-0 h-[54%] w-[48%] overflow-hidden rounded-[1.5rem] border-4 border-white bg-charcoal/5 shadow-elevated">
              <SafeImage
                src="/media/home/showcase-patagonia.jpg"
                alt="Патагония — ледники и большие маршруты"
                fill
                placeholderVariant="destination"
                className="object-cover"
                sizes="(max-width: 1024px) 48vw, 270px"
              />
            </div>
            <p className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-charcoal/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm sm:bottom-8 sm:left-6">
              Сделано людьми, которые живут Аргентиной
            </p>
          </div>
        </div>
      </section>

      <PlatformStatsBlock initialStats={platformStats} />

      {/* Platform story */}
      <section className="py-16 sm:py-20">
        <div className={siteContainerClass}>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">
                {t("about.story.title")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate">{t("about.story.p1")}</p>
              <p className="mt-4 text-base leading-relaxed text-slate">{t("about.story.p2")}</p>
              <Link
                href="/join"
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-sky hover:underline"
              >
                {t("about.story.organizerCta")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-1">
              {VALUE_KEYS.map(({ icon: Icon, titleKey, textKey }) => (
                <div
                  key={titleKey}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky/10 text-sky">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold text-charcoal">{t(titleKey)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{t(textKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Explore */}
      <section className="border-t border-gray-100 py-14 sm:py-16">
        <div className={siteContainerClass}>
          <h2 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">
            {t("about.explore.title")}
          </h2>
          <p className="mt-3 max-w-2xl text-slate">{t("about.explore.subtitle")}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {EXPLORE_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-sky/30 hover:shadow-md"
              >
                <h3 className="font-heading text-lg font-bold text-charcoal">{t(item.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{t(item.textKey)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 bg-surface-muted py-16">
        <div className={cn(siteContainerClass, "text-center")}>
          <h2 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">
            {t("about.cta.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-slate">{t("about.cta.subtitle")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/tours">
              <Button size="lg">{t("about.cta.tours")}</Button>
            </Link>
            <Link href="/contacts">
              <Button size="lg" variant="outline">
                {t("about.cta.contact")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
