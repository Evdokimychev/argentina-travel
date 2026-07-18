"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HubHero from "@/components/guide/hub/HubHero";
import RelatedContentCards from "@/components/content/RelatedContentCards";
import GuidePillarCta from "@/components/guide/GuidePillarCta";
import GuidePillarFaq from "@/components/guide/GuidePillarFaq";
import GuideSectionNav from "@/components/guide/GuideSectionNav";
import HubQuickFactsGrid from "@/components/guide/hub/HubQuickFactsGrid";
import HubSection from "@/components/guide/hub/HubSection";
import HubToc from "@/components/guide/hub/HubToc";
import ArgentinaTourismInfographic from "@/components/travel/ArgentinaTourismInfographic";
import ArgentinaTourismTimeline from "@/components/travel/ArgentinaTourismTimeline";
import FAQPageJsonLd from "@/components/seo/FAQPageJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { GUIDE_HUB } from "@/data/guide-hub-index-content";
import { getGuideTopicIcon } from "@/lib/guide-nav-icons";
import { cn } from "@/lib/cn";
import { siteContainerClass, siteScrollAnchorClass } from "@/lib/site-container";
import {
  tokenCardInteractiveClass,
  tokenCardSurfaceClass,
  tokenFocusRingClass,
} from "@/lib/design-tokens";
import type { RelatedContentItem } from "@/types/content-reading";

const GUIDE_KB_LINKS: RelatedContentItem[] = [
  {
    title: "Подготовка к поездке",
    href: "/baza-znaniy/podgotovka-k-poezdke",
    description: "Что проверить перед вылетом: документы, страховка, связь, деньги и маршрут.",
    kind: "link",
  },
  {
    title: "Деньги и обмен валюты",
    href: "/baza-znaniy/razdel/finansy",
    description: "Песо, наличные доллары, карты и реальные сценарии оплаты в поездке.",
    kind: "link",
  },
  {
    title: "Транспорт по стране",
    href: "/baza-znaniy/gid-po-transportu",
    description: "Внутренние рейсы, автобусы, аренда автомобиля и длинные переезды.",
    kind: "link",
  },
  {
    title: "Безопасность в Аргентине",
    href: "/baza-znaniy/bezopasnost-argentina",
    description: "Риски больших городов, тропы, погода и спокойная базовая осмотрительность.",
    kind: "link",
  },
  {
    title: "eSIM и связь",
    href: "/baza-znaniy/esim-i-svyaz",
    description: "Как оставаться на связи: eSIM, местные операторы, мессенджеры и карты.",
    kind: "link",
  },
  {
    title: "Водительские права",
    href: "/baza-znaniy/voditelskie-prava",
    description: "Что важно знать перед арендой автомобиля и поездками между регионами.",
    kind: "link",
  },
];

export default function GuideHubView({ heroImage }: { heroImage: string }) {
  const { t } = useLocaleCurrency();
  const hub = GUIDE_HUB;
  const path = "/guide";
  const heroTitle = t("guide.hub.hero.title");
  const heroSubtitle = t("guide.hub.hero.subtitle");

  return (
    <>
      <WebPageJsonLd name={heroTitle} description={heroSubtitle} path={path} />
      <FAQPageJsonLd questions={hub.faq} path={path} />

      <HubHero
        title={heroTitle}
        subtitle={heroSubtitle}
        image={heroImage}
        theme="highland"
        eyebrow={{ label: t("guide.hub.hero.eyebrow") }}
        ctas={hub.heroCtas}
      />

      <GuideSectionNav />

      <div className="bg-surface-muted pb-16">
        <div className={cn(siteContainerClass, "py-8 md:py-12")}>
          <nav className="text-sm text-slate" aria-label={t("guide.hub.breadcrumbAria")}>
            <Link href="/" className="transition-colors hover:text-sky">
              {t("nav.home")}
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-charcoal">{t("nav.guide")}</span>
          </nav>

          <div className="mt-8 lg:flex lg:items-start lg:gap-8 xl:gap-10">
            <div className="min-w-0 flex-1 space-y-8">
              <HubToc items={hub.toc} variant="mobile" />

              <HubSection id="quick-30" title={t("guide.hub.section.quick30")}>
                <HubQuickFactsGrid facts={hub.quickFacts30} />
              </HubSection>

              <HubSection id="country-overview" title={t("guide.hub.section.countryOverview")}>
                <ArgentinaTourismInfographic compact />
              </HubSection>

              <HubSection id="tourism-evolution" title={t("guide.hub.section.tourismEvolution")}>
                <ArgentinaTourismTimeline />
              </HubSection>

              <HubSection id="planning" title={t("guide.hub.section.planning")} subtitle={hub.planning.intro}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {hub.planning.cards.map((card) => (
                    <article
                      key={card.title}
                      className={cn(
                        "flex flex-col p-4",
                        tokenCardSurfaceClass,
                        tokenCardInteractiveClass,
                      )}
                    >
                      <span className="text-2xl" aria-hidden>
                        {card.emoji}
                      </span>
                      <h3 className="mt-2 font-heading font-bold text-charcoal">{card.title}</h3>
                      <p className="mt-1 flex-1 text-sm leading-relaxed text-slate">{card.body}</p>
                      {card.href && card.linkLabel ? (
                        <Link
                          href={card.href}
                          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-ink hover:underline"
                        >
                          {card.linkLabel}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </article>
                  ))}
                </div>
              </HubSection>

              <HubSection
                id="knowledge-base"
                title="Полезно знать перед поездкой"
                subtitle="Короткий путь из путеводителя к практическим материалам базы знаний: деньги, связь, документы, безопасность и транспорт."
              >
                <RelatedContentCards
                  title="Практические материалы"
                  items={GUIDE_KB_LINKS}
                />
              </HubSection>

              {hub.topicGroups.map((group) => (
                <HubSection
                  key={group.id}
                  id={group.id}
                  title={group.title}
                  subtitle={group.subtitle}
                >
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.topics.map((topic) => {
                      const Icon = getGuideTopicIcon(topic.slug);
                      return (
                        <Link
                          key={topic.slug}
                          href={topic.href}
                          className={cn(
                            "group flex flex-col p-4",
                            tokenCardSurfaceClass,
                            tokenCardInteractiveClass,
                            tokenFocusRingClass,
                            "hover:border-sky/30 hover:bg-sky/5",
                          )}
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky/10 text-sky transition-colors group-hover:bg-sky group-hover:text-white">
                            <Icon className="h-5 w-5" aria-hidden />
                          </span>
                          <h3 className="mt-3 font-heading font-bold text-charcoal group-hover:text-sky-ink">
                            {topic.title}
                          </h3>
                          <p className="mt-1 flex-1 text-sm text-slate">{topic.description}</p>
                          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-ink">
                            {t("guide.hub.link.more")}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </HubSection>
              ))}

              <HubSection id="all-topics" title={t("guide.hub.section.allTopics")}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {hub.topicGroups.flatMap((group) => group.topics).map((topic) => {
                    const Icon = getGuideTopicIcon(topic.slug);
                    return (
                      <Link
                        key={`all-${topic.slug}`}
                        href={topic.href}
                        className={cn(
                          "group flex items-start gap-3 p-3",
                          tokenCardSurfaceClass,
                          tokenCardInteractiveClass,
                          tokenFocusRingClass,
                          "hover:border-sky/30 hover:bg-sky/5",
                        )}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky/10 text-sky transition-colors group-hover:bg-sky group-hover:text-white">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-charcoal group-hover:text-sky-ink">
                            {topic.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate">{topic.description}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </HubSection>

              <section
                id="related"
                className={cn(siteScrollAnchorClass, "rounded-panel border border-border-subtle bg-surface-elevated p-6 shadow-card sm:p-8")}
              >
                <h2 className="font-heading text-xl font-bold text-charcoal">{t("guide.hub.section.related")}</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {hub.relatedLinks.map((link) => (
                    <Link
                      key={link.href + link.title}
                      href={link.href}
                      className={cn(
                        "group flex items-start justify-between gap-3 p-4",
                        tokenCardSurfaceClass,
                        tokenCardInteractiveClass,
                        tokenFocusRingClass,
                        "hover:border-sky/30 hover:bg-sky/5",
                      )}
                    >
                      <span>
                        <span className="block font-medium text-charcoal group-hover:text-sky-ink">
                          {link.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate">{link.description}</span>
                      </span>
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate group-hover:text-sky" />
                    </Link>
                  ))}
                </div>
              </section>

              <p className="text-sm text-slate">{hub.disclaimer}</p>

              <GuidePillarFaq items={hub.faq} intro={t("guide.hub.faqIntro")} />

              <GuidePillarCta
                title={t("guide.hub.cta.title")}
                subtitle={t("guide.hub.cta.subtitle")}
              />
            </div>

            <HubToc items={hub.toc} variant="sidebar" />
          </div>
        </div>
      </div>
    </>
  );
}
