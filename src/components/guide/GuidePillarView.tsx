import Link from "next/link";
import { Suspense } from "react";
import GuideNextTopic from "@/components/guide/GuideNextTopic";
import GuidePillarCta from "@/components/guide/GuidePillarCta";
import GuidePillarFaq from "@/components/guide/GuidePillarFaq";
import GuidePillarRecommend from "@/components/guide/GuidePillarRecommend";
import GuidePillarSectionBlock from "@/components/guide/GuidePillarSection";
import GuidePracticalTips from "@/components/guide/GuidePracticalTips";
import GuideQuickFacts, { GuideQuickFactsStatic } from "@/components/guide/GuideQuickFacts";
import GuideRelatedArticlesGrid, {
  type GuideRelatedArticle,
} from "@/components/guide/GuideRelatedArticlesGrid";
import GuideSectionNav from "@/components/guide/GuideSectionNav";
import GuideWidgetSlot from "@/components/guide/GuideWidgetSlot";
import HubHero from "@/components/guide/hub/HubHero";
import HubSection from "@/components/guide/hub/HubSection";
import HubToc from "@/components/guide/hub/HubToc";
import { PageSlotImage } from "@/components/media/ContentSectionImage";
import FAQPageJsonLd from "@/components/seo/FAQPageJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { getGuidePracticalTips } from "@/data/guide-pillar-practical-tips";
import { buildGuidePillarToc } from "@/lib/build-guide-pillar-toc";
import { getGuideTopicHeroImage } from "@/lib/media-resolver";
import { cn } from "@/lib/cn";
import { guideTopicHref } from "@/lib/guide-topics";
import { siteContainerClass } from "@/lib/site-container";
import type { GuideTopicPage } from "@/types/guide-topic";
import type { TourListing } from "@/types";

interface GuidePillarViewProps {
  topic: GuideTopicPage;
  initialTours?: TourListing[];
}

function QuickFactsFallback() {
  return (
    <div className="grid animate-pulse gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-gray-100" />
      ))}
    </div>
  );
}

export default function GuidePillarView({ topic, initialTours = [] }: GuidePillarViewProps) {
  const pillar = topic.pillarPage;
  if (!pillar) return null;

  const heroTitle = pillar.heroTitle ?? `${topic.title} в Аргентине`;
  const heroSubtitle = pillar.heroSubtitle ?? topic.shortDescription;
  const heroImage = topic.heroImage ?? getGuideTopicHeroImage(topic.slug);
  const widgetSlots = pillar.widgetSlots ?? [];
  const hasLiveFacts = pillar.quickFacts.some((f) => f.live);
  const practicalTips = pillar.practicalTips ?? getGuidePracticalTips(topic.slug);
  const path = guideTopicHref(topic.slug);

  const relatedArticles: GuideRelatedArticle[] = [
    ...pillar.blogLinks.map((link) => ({
      title: link.title,
      href: link.href,
      description: link.description,
    })),
    ...(topic.relatedArticles?.map((article) => ({
      title: article.label,
      href: article.href,
      description: article.description,
    })) ?? []),
  ];

  const tocItems = buildGuidePillarToc(pillar, {
    hasPracticalTips: Boolean(practicalTips),
    hasReadMore: relatedArticles.length > 0,
  });

  return (
    <>
      <WebPageJsonLd name={heroTitle} description={heroSubtitle} path={path} />
      <FAQPageJsonLd questions={pillar.faq} path={path} />

      <HubHero
        title={heroTitle}
        subtitle={heroSubtitle}
        image={heroImage}
        eyebrow={{ label: "Путеводитель", href: "/guide" }}
        ctas={pillar.heroCtas}
      />

      <GuideSectionNav />

      <div className="bg-surface-muted pb-16">
        <div className={cn(siteContainerClass, "py-8 md:py-12")}>
          <nav className="text-sm text-slate" aria-label="Хлебные крошки">
            <Link href="/" className="transition-colors hover:text-sky">
              Главная
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <Link href="/guide" className="transition-colors hover:text-sky">
              Путеводитель
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-charcoal">{topic.title}</span>
          </nav>

          <div className="mt-8 lg:flex lg:items-start lg:gap-8 xl:gap-10">
            <div className="min-w-0 flex-1 space-y-8">
              <HubToc items={tocItems} variant="mobile" />

              <HubSection id="quick-30" title="Кратко за 30 секунд">
                {hasLiveFacts ? (
                  <Suspense fallback={<QuickFactsFallback />}>
                    <GuideQuickFacts facts={pillar.quickFacts} slug={topic.slug} />
                  </Suspense>
                ) : (
                  <GuideQuickFactsStatic facts={pillar.quickFacts} slug={topic.slug} />
                )}
              </HubSection>

              <PageSlotImage pageId={`guide:${topic.slug}`} slotId="content" />

              {pillar.sections.map((section) => (
                <GuidePillarSectionBlock
                  key={section.id}
                  section={section}
                  initialTours={initialTours}
                />
              ))}

              {widgetSlots.length > 0 ? (
                <div className="space-y-8" aria-label="Интерактивные блоки">
                  {widgetSlots.map((slot) => (
                    <GuideWidgetSlot key={slot.id} slot={slot} initialTours={initialTours} />
                  ))}
                </div>
              ) : null}

              {practicalTips ? <GuidePracticalTips tips={practicalTips} /> : null}

              <GuidePillarRecommend
                services={pillar.partnerServices}
                intro={pillar.recommendIntro}
              />

              <GuideRelatedArticlesGrid articles={relatedArticles} />

              <GuideNextTopic slug={topic.slug} />

              <GuidePillarFaq items={pillar.faq} />

              <GuidePillarCta />
            </div>

            <HubToc items={tocItems} variant="sidebar" />
          </div>
        </div>
      </div>
    </>
  );
}
