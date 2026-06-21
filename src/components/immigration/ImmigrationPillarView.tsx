import Link from "next/link";
import GuidePillarCta from "@/components/guide/GuidePillarCta";
import GuidePillarFaq from "@/components/guide/GuidePillarFaq";
import GuidePillarSectionBlock from "@/components/guide/GuidePillarSection";
import GuidePillarRecommend from "@/components/guide/GuidePillarRecommend";
import GuideQuickFactsStatic from "@/components/guide/GuideQuickFacts";
import GuideRelatedArticlesGrid from "@/components/guide/GuideRelatedArticlesGrid";
import HubHero from "@/components/guide/hub/HubHero";
import HubSection from "@/components/guide/hub/HubSection";
import HubToc from "@/components/guide/hub/HubToc";
import ImmigrationNextTopic from "@/components/immigration/ImmigrationNextTopic";
import ArgentinaPassportPowerWidget from "@/components/immigration/ArgentinaPassportPowerWidget";
import ImmigrationSectionNav from "@/components/immigration/ImmigrationSectionNav";
import ImmigrationTopicRichSections, {
  getImmigrationTopicTocExtras,
} from "@/components/immigration/ImmigrationTopicRichSections";
import { PageSlotImage } from "@/components/media/ContentSectionImage";
import FAQPageJsonLd from "@/components/seo/FAQPageJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildGuidePillarToc } from "@/lib/build-guide-pillar-toc";
import { cn } from "@/lib/cn";
import { getImmigrationTopicHeroImage } from "@/lib/media-resolver";
import { immigrationTopicHref } from "@/lib/immigration-topics";
import { siteContainerClass } from "@/lib/site-container";
import type { ImmigrationTopicPage } from "@/types/immigration-topic";
import type { ImmigrationTopicSlug } from "@/data/immigration-topics";

interface ImmigrationPillarViewProps {
  topic: ImmigrationTopicPage;
}

export default function ImmigrationPillarView({ topic }: ImmigrationPillarViewProps) {
  const pillar = topic.pillarPage;
  const heroTitle = pillar.heroTitle ?? topic.title;
  const heroSubtitle = pillar.heroSubtitle ?? topic.shortDescription;
  const heroImage = topic.heroImage ?? getImmigrationTopicHeroImage(topic.slug);
  const path = immigrationTopicHref(topic.slug);

  const relatedArticles = pillar.blogLinks.map((link) => ({
    title: link.title,
    href: link.href,
    description: link.description,
  }));

  const baseToc = buildGuidePillarToc(pillar, {
    hasReadMore: relatedArticles.length > 0,
  });
  const richToc = getImmigrationTopicTocExtras(topic.slug as ImmigrationTopicSlug);
  const overviewIndex = baseToc.findIndex((item) => item.id !== "quick-30");
  let tocItems =
    overviewIndex >= 0
      ? [
          ...baseToc.slice(0, overviewIndex + 1),
          ...richToc,
          ...baseToc.slice(overviewIndex + 1),
        ]
      : [...baseToc, ...richToc];

  if (topic.slug === "grazhdanstvo") {
    const quickIndex = tocItems.findIndex((item) => item.id === "quick-30");
    if (quickIndex >= 0) {
      tocItems = [
        ...tocItems.slice(0, quickIndex + 1),
        { id: "passport-power", label: "Сила паспорта" },
        ...tocItems.slice(quickIndex + 1),
      ];
    }
  }

  return (
    <>
      <WebPageJsonLd name={heroTitle} description={heroSubtitle} path={path} />
      <FAQPageJsonLd questions={pillar.faq} path={path} />

      <HubHero
        title={heroTitle}
        subtitle={heroSubtitle}
        image={heroImage}
        eyebrow={{ label: "Иммиграция", href: "/immigration" }}
        ctas={pillar.heroCtas}
      />

      <ImmigrationSectionNav />

      <div className="bg-surface-muted pb-16">
        <div className={cn(siteContainerClass, "py-8 md:py-12")}>
          <nav className="text-sm text-slate" aria-label="Хлебные крошки">
            <Link href="/" className="transition-colors hover:text-sky">
              Главная
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <Link href="/immigration" className="transition-colors hover:text-sky">
              Иммиграция
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-charcoal">{topic.title}</span>
          </nav>

          <div className="mt-8 lg:flex lg:items-start lg:gap-8 xl:gap-10">
            <div className="min-w-0 flex-1 space-y-8">
              <HubToc items={tocItems} variant="mobile" />

              <HubSection id="quick-30" title="Кратко за 30 секунд">
                {topic.slug === "grazhdanstvo" ? (
                  <div className="space-y-6">
                    <ArgentinaPassportPowerWidget />
                    <GuideQuickFactsStatic
                      facts={pillar.quickFacts.filter((fact) => fact.label !== "Паспорт AR")}
                      slug={topic.slug}
                      columns={3}
                    />
                  </div>
                ) : (
                  <GuideQuickFactsStatic facts={pillar.quickFacts} slug={topic.slug} />
                )}
              </HubSection>

              <PageSlotImage pageId={`immigration:${topic.slug}`} slotId="section" />

              {pillar.sections.map((section) => (
                <GuidePillarSectionBlock key={section.id} section={section} />
              ))}

              <ImmigrationTopicRichSections slug={topic.slug as ImmigrationTopicSlug} />

              {pillar.partnerServices.length > 0 ? (
                <GuidePillarRecommend
                  services={pillar.partnerServices}
                  intro={pillar.recommendIntro}
                />
              ) : null}

              {relatedArticles.length > 0 ? (
                <GuideRelatedArticlesGrid articles={relatedArticles} />
              ) : null}

              <ImmigrationNextTopic slug={topic.slug} />

              <GuidePillarFaq items={pillar.faq} />

              <GuidePillarCta
                title="Остались вопросы об иммиграции?"
                subtitle="Запросите контакты партнёров или задайте вопрос о турах и платформе — мы не оказываем юридических услуг."
              />
            </div>

            <HubToc items={tocItems} variant="sidebar" />
          </div>
        </div>
      </div>
    </>
  );
}
