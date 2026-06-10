import Link from "next/link";
import { Suspense } from "react";
import { BookOpen } from "lucide-react";
import GuidePillarCta from "@/components/guide/GuidePillarCta";
import GuidePillarFaq from "@/components/guide/GuidePillarFaq";
import GuidePillarHero from "@/components/guide/GuidePillarHero";
import GuidePillarRecommend from "@/components/guide/GuidePillarRecommend";
import GuidePillarSectionBlock from "@/components/guide/GuidePillarSection";
import GuidePillarToc from "@/components/guide/GuidePillarToc";
import GuideQuickFacts, { GuideQuickFactsStatic } from "@/components/guide/GuideQuickFacts";
import GuideWidgetSlot from "@/components/guide/GuideWidgetSlot";
import FAQPageJsonLd from "@/components/seo/FAQPageJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { cn } from "@/lib/cn";
import { guideTopicHref } from "@/lib/guide-topics";
import { siteContainerClass } from "@/lib/site-container";
import type { GuideTopicPage } from "@/types/guide-topic";

interface GuidePillarViewProps {
  topic: GuideTopicPage;
}

function QuickFactsFallback() {
  return (
    <section className="mt-8 animate-pulse" aria-busy="true">
      <div className="h-6 w-40 rounded bg-gray-200" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-gray-100" />
        ))}
      </div>
    </section>
  );
}

export default function GuidePillarView({ topic }: GuidePillarViewProps) {
  const pillar = topic.pillarPage;
  if (!pillar) return null;

  const heroTitle = pillar.heroTitle ?? `${topic.title} в Аргентине`;
  const heroSubtitle = pillar.heroSubtitle ?? topic.shortDescription;
  const widgetSlots = pillar.widgetSlots ?? [];
  const hasLiveFacts = pillar.quickFacts.some((f) => f.live);
  const path = guideTopicHref(topic.slug);

  return (
    <>
      <WebPageJsonLd name={heroTitle} description={heroSubtitle} path={path} />
      <FAQPageJsonLd questions={pillar.faq} path={path} />

      <GuidePillarHero
        topic={topic}
        heroTitle={heroTitle}
        heroSubtitle={heroSubtitle}
        ctas={pillar.heroCtas}
      />

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

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate">{topic.intro}</p>

          {hasLiveFacts ? (
            <Suspense fallback={<QuickFactsFallback />}>
              <GuideQuickFacts facts={pillar.quickFacts} />
            </Suspense>
          ) : (
            <GuideQuickFactsStatic facts={pillar.quickFacts} />
          )}

          <div className="mt-8 lg:hidden">
            <GuidePillarToc
              sections={pillar.sections}
              widgetSlots={widgetSlots}
              variant="mobile"
            />
          </div>

          <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0 space-y-12">
              {pillar.sections.map((section) => (
                <GuidePillarSectionBlock key={section.id} section={section} />
              ))}

              {widgetSlots.length > 0 ? (
                <section className="space-y-6" aria-label="Интерактивные блоки">
                  {widgetSlots.map((slot) => (
                    <GuideWidgetSlot key={slot.id} slot={slot} />
                  ))}
                </section>
              ) : null}

              <GuidePillarRecommend
                services={pillar.partnerServices}
                intro={pillar.recommendIntro}
              />

              <section id="read-more" className="scroll-mt-24">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-sky" aria-hidden />
                  <h2 className="font-display text-xl font-bold text-charcoal">Читайте также</h2>
                </div>
                <ul className="mt-4 space-y-2">
                  {pillar.blogLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group flex flex-col rounded-xl border border-gray-100 bg-white px-4 py-3 transition-colors hover:border-sky/30 hover:bg-sky/5"
                      >
                        <span className="text-sm font-medium text-charcoal group-hover:text-sky">
                          {link.title}
                        </span>
                        {link.description ? (
                          <span className="mt-0.5 text-xs text-slate">{link.description}</span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                  {topic.relatedArticles?.map((article) => (
                    <li key={article.href}>
                      <Link
                        href={article.href}
                        className="group flex flex-col rounded-xl border border-gray-100 bg-white px-4 py-3 transition-colors hover:border-sky/30 hover:bg-sky/5"
                      >
                        <span className="text-sm font-medium text-charcoal group-hover:text-sky">
                          {article.label}
                        </span>
                        {article.description ? (
                          <span className="mt-0.5 text-xs text-slate">{article.description}</span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <GuidePillarFaq items={pillar.faq} />

              <GuidePillarCta />
            </div>

            <GuidePillarToc
              sections={pillar.sections}
              widgetSlots={widgetSlots}
              variant="sidebar"
            />
          </div>
        </div>
      </div>
    </>
  );
}
