import Link from "next/link";
import { ArrowRight, ExternalLink, MapPin } from "lucide-react";
import GuidePillarFaq from "@/components/guide/GuidePillarFaq";
import GuideSectionNav from "@/components/guide/GuideSectionNav";
import HubHero from "@/components/guide/hub/HubHero";
import HubSection from "@/components/guide/hub/HubSection";
import HubToc from "@/components/guide/hub/HubToc";
import ArgentinaTourismInfographic from "@/components/travel/ArgentinaTourismInfographic";
import ArgentinaTourismTimeline from "@/components/travel/ArgentinaTourismTimeline";
import FAQPageJsonLd from "@/components/seo/FAQPageJsonLd";
import RelatedKnowledgeSection from "@/components/knowledge/RelatedKnowledgeSection";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import {
  GUIDE_ABOUT_ARGENTINA,
  GUIDE_ABOUT_ARGENTINA_PATH,
} from "@/data/guide-about-argentina";
import { resolveKnowledgeLinksForAboutArgentina } from "@/lib/knowledge-internal-links";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

export default function AboutArgentinaView() {
  const content = GUIDE_ABOUT_ARGENTINA;
  const knowledgeLinks = resolveKnowledgeLinksForAboutArgentina();

  return (
    <>
      <WebPageJsonLd
        name={content.heroTitle}
        description={content.heroSubtitle}
        path={GUIDE_ABOUT_ARGENTINA_PATH}
      />
      <FAQPageJsonLd questions={content.faq} path={GUIDE_ABOUT_ARGENTINA_PATH} />

      <HubHero
        title={content.heroTitle}
        subtitle={content.heroSubtitle}
        image={content.heroImage}
        eyebrow={{ label: "Путеводитель", href: "/guide" }}
        ctas={content.heroCtas}
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
            <span className="text-charcoal">{content.heroTitle}</span>
          </nav>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate">{content.intro}</p>

          <div className="mt-8 lg:flex lg:items-start lg:gap-8 xl:gap-10">
            <aside className="hidden w-56 shrink-0 lg:block xl:w-64">
              <HubToc items={content.toc} variant="sidebar" />
            </aside>

            <div className="min-w-0 flex-1 space-y-10">
              <HubToc items={content.toc} variant="mobile" />

              <HubSection id="quick-facts" title="Цифры и факты">
                <ArgentinaTourismInfographic />
              </HubSection>

              <HubSection id="geography" title={content.geography.heading}>
                <p className="text-sm leading-relaxed text-slate">{content.geography.body}</p>
              </HubSection>

              <HubSection
                id="tourism-evolution"
                title="Эволюция туризма"
                subtitle="От пампы и estancia до контрастных маршрутов XXI века"
              >
                <ArgentinaTourismTimeline />
              </HubSection>

              <HubSection id="why-visit" title={content.whyVisit.heading}>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {content.whyVisit.bullets.map((item) => (
                    <li
                      key={item}
                      className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm leading-relaxed text-charcoal"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </HubSection>

              <HubSection
                id="regions"
                title="Куда ехать: регионы по приоритету"
                subtitle="Рейтинг для первого визита — с ссылками на направления и турами на платформе."
              >
                <div className="space-y-4">
                  {content.regions.map((region) => (
                    <article
                      key={region.title}
                      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-sky">
                            #{region.rank} · {region.days}
                          </span>
                          <h3 className="mt-1 font-heading text-xl font-bold text-charcoal">{region.title}</h3>
                        </div>
                        <Link
                          href={region.href}
                          className="inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
                        >
                          Подробнее
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate">{region.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {region.highlights.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-charcoal/5 px-2.5 py-1 text-xs font-medium text-charcoal"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
                <Link
                  href="/destinations"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
                >
                  Все направления в каталоге
                  <MapPin className="h-4 w-4" />
                </Link>
              </HubSection>

              <HubSection id="itineraries" title="Готовые маршруты">
                <div className="grid gap-4 lg:grid-cols-3">
                  {content.itineraries.map((plan) => (
                    <article
                      key={plan.title}
                      className="flex flex-col rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/5 to-white p-5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky">{plan.duration}</p>
                      <h3 className="mt-1 font-heading text-lg font-bold text-charcoal">{plan.title}</h3>
                      <ol className="mt-3 flex-1 space-y-1.5 text-sm text-slate">
                        {plan.stops.map((stop) => (
                          <li key={stop} className="flex gap-2">
                            <span className="text-sky" aria-hidden>
                              ·
                            </span>
                            {stop}
                          </li>
                        ))}
                      </ol>
                      {plan.note ? (
                        <p className="mt-3 border-t border-sky/10 pt-3 text-xs leading-relaxed text-slate">
                          {plan.note}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </HubSection>

              <HubSection
                id="practical"
                title="Практика: с чего начать"
                subtitle="Углублённые темы — в разделах путеводителя."
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {content.practicalCards.map((card) => (
                    <article
                      key={card.title}
                      className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-md"
                    >
                      <span className="text-2xl" aria-hidden>
                        {card.emoji}
                      </span>
                      <h3 className="mt-2 font-heading font-bold text-charcoal">{card.title}</h3>
                      <p className="mt-1 flex-1 text-sm leading-relaxed text-slate">{card.body}</p>
                      <Link
                        href={card.href}
                        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
                      >
                        {card.linkLabel}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </article>
                  ))}
                </div>
              </HubSection>

              <HubSection id="neighbors" title={content.neighborCountries.heading}>
                <p className="text-sm leading-relaxed text-slate">{content.neighborCountries.body}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {content.neighborCountries.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm transition hover:border-sky/30 hover:shadow-sm"
                    >
                      <span className="font-medium text-charcoal">{link.title}</span>
                      {link.description ? (
                        <span className="mt-0.5 block text-xs text-slate">{link.description}</span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </HubSection>

              <HubSection id="faq" title="Частые вопросы">
                <GuidePillarFaq items={content.faq} />
              </HubSection>

              <RelatedKnowledgeSection links={knowledgeLinks} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm" />

              <HubSection id="sources" title="Дополнительно почитать">
                <p className="mb-4 text-sm text-slate">
                  Материал страницы подготовлен редакцией платформы на основе открытых практических
                  путеводств и типичных маршрутов. Рекомендуем также:
                </p>
                <ul className="space-y-3">
                  {content.furtherReading.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 transition hover:border-sky/30"
                      >
                        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
                        <span>
                          <span className="font-medium text-charcoal group-hover:text-sky">{link.title}</span>
                          {link.description ? (
                            <span className="mt-0.5 block text-xs text-slate">{link.description}</span>
                          ) : null}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-slate">{content.disclaimer}</p>
              </HubSection>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
