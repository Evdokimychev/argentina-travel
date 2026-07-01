"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import HubHero from "@/components/guide/hub/HubHero";
import ImmigrationSectionNav from "@/components/immigration/ImmigrationSectionNav";
import GuidePillarCta from "@/components/guide/GuidePillarCta";
import GuidePillarFaq from "@/components/guide/GuidePillarFaq";
import HubQuickFactsGrid from "@/components/guide/hub/HubQuickFactsGrid";
import HubSection from "@/components/guide/hub/HubSection";
import HubToc from "@/components/guide/hub/HubToc";
import FAQPageJsonLd from "@/components/seo/FAQPageJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { IMMIGRATION_HUB } from "@/data/immigration-hub-content";
import { cn } from "@/lib/cn";
import { getImmigrationHubTopicIcon } from "@/lib/immigration-nav-icons";
import { siteContainerClass } from "@/lib/site-container";

function HubTopicGrid({
  topics,
  linkLabel,
}: {
  topics: typeof IMMIGRATION_HUB.hubTopics;
  linkLabel: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map((topic) => {
        const Icon = getImmigrationHubTopicIcon(topic.id);
        return (
          <Link
            key={topic.id}
            href={topic.href}
            className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-4 transition-colors hover:border-sky/30 hover:bg-sky/5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky/10 text-sky transition-colors group-hover:bg-sky group-hover:text-white">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="mt-3 font-heading font-bold text-charcoal group-hover:text-sky">
              {topic.title}
            </h3>
            <p className="mt-1 flex-1 text-sm text-slate">{topic.description}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky">
              {linkLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function TopicTeaserList({
  topics,
  moreLabel,
}: {
  topics: typeof IMMIGRATION_HUB.hubTopics;
  moreLabel: string;
}) {
  return (
    <div className="space-y-4">
      {topics.map((topic) => {
        const Icon = getImmigrationHubTopicIcon(topic.id);
        return (
          <article
            key={topic.id}
            className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-heading text-lg font-bold text-charcoal">{topic.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate line-clamp-3">{topic.teaser}</p>
                <Link
                  href={topic.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
                >
                  {moreLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

type ImmigrationHubViewProps = {
  /** Server-rendered flight teaser — must not be imported from this client module. */
  flightHint?: ReactNode;
};

export default function ImmigrationHubView({ flightHint }: ImmigrationHubViewProps) {
  const { t } = useLocaleCurrency();
  const hub = IMMIGRATION_HUB;
  const path = "/immigration";
  const heroTitle = t("immigration.hub.hero.title");
  const heroSubtitle = t("immigration.hub.hero.subtitle");

  return (
    <>
      <WebPageJsonLd name={heroTitle} description={heroSubtitle} path={path} />
      <FAQPageJsonLd questions={hub.faq} path={path} />

      <HubHero
        title={heroTitle}
        subtitle={heroSubtitle}
        image={hub.heroImage}
        eyebrow={{ label: t("immigration.hub.hero.eyebrow") }}
        ctas={hub.heroCtas}
      />

      <ImmigrationSectionNav />

      <div className="bg-surface-muted pb-16">
        <div className={cn(siteContainerClass, "py-8 md:py-12")}>
          <nav className="text-sm text-slate" aria-label={t("immigration.hub.breadcrumbAria")}>
            <Link href="/" className="transition-colors hover:text-sky">
              {t("nav.home")}
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-charcoal">{t("nav.immigration")}</span>
          </nav>

          <div className="mt-8 lg:flex lg:items-start lg:gap-8 xl:gap-10">
            <div className="min-w-0 flex-1 space-y-8">
              <HubToc items={hub.toc} variant="mobile" />

              <HubSection id="quick-30" title={t("immigration.hub.section.quick30")}>
                <HubQuickFactsGrid facts={hub.quickFacts30} columns={4} />
              </HubSection>

              <HubSection
                id="hub-overview"
                title={t("immigration.hub.section.overview")}
                subtitle={t("immigration.hub.section.overviewSubtitle")}
              >
                <HubTopicGrid topics={hub.hubTopics} linkLabel={t("immigration.hub.link.open")} />
              </HubSection>

              <HubSection
                id="topic-summaries"
                title={t("immigration.hub.section.summaries")}
                subtitle={t("immigration.hub.section.summariesSubtitle")}
              >
                <TopicTeaserList topics={hub.hubTopics} moreLabel={t("immigration.hub.link.more")} />
              </HubSection>

              {flightHint}

              <div className="space-y-3">
                {hub.warnings.map((warning) => (
                  <aside
                    key={warning}
                    className="flex gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4"
                  >
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                    <p className="text-sm text-charcoal">{warning}</p>
                  </aside>
                ))}
              </div>

              <p className="text-sm text-slate">{hub.disclaimer}</p>

              <GuidePillarFaq items={hub.faq} intro={t("immigration.hub.faqIntro")} />

              <GuidePillarCta
                title={t("immigration.hub.cta.title")}
                subtitle={t("immigration.hub.cta.subtitle")}
              />
            </div>

            <HubToc items={hub.toc} variant="sidebar" />
          </div>
        </div>
      </div>
    </>
  );
}
