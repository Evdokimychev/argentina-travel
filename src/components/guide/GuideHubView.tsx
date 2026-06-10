import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HubHero from "@/components/guide/hub/HubHero";
import GuidePillarCta from "@/components/guide/GuidePillarCta";
import GuidePillarFaq from "@/components/guide/GuidePillarFaq";
import GuideSectionNav from "@/components/guide/GuideSectionNav";
import HubSection from "@/components/guide/hub/HubSection";
import HubToc from "@/components/guide/hub/HubToc";
import FAQPageJsonLd from "@/components/seo/FAQPageJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { GUIDE_HUB } from "@/data/guide-hub-index-content";
import { getGuideTopicIcon } from "@/lib/guide-nav-icons";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

export default function GuideHubView() {
  const hub = GUIDE_HUB;
  const path = "/guide";

  return (
    <>
      <WebPageJsonLd name={hub.heroTitle} description={hub.heroSubtitle} path={path} />
      <FAQPageJsonLd questions={hub.faq} path={path} />

      <HubHero
        title={hub.heroTitle}
        subtitle={hub.heroSubtitle}
        image={hub.heroImage}
        eyebrow={{ label: "Путеводитель" }}
        ctas={hub.heroCtas}
      />

      <GuideSectionNav />

      <div className="bg-surface-muted pb-16">
        <div className={cn(siteContainerClass, "py-8 md:py-12")}>
          <nav className="text-sm text-slate" aria-label="Хлебные крошки">
            <Link href="/" className="transition-colors hover:text-sky">
              Главная
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-charcoal">Путеводитель</span>
          </nav>

          <div className="mt-8 lg:flex lg:items-start lg:gap-8 xl:gap-10">
            <div className="min-w-0 flex-1 space-y-8">
              <HubToc items={hub.toc} variant="mobile" />

              <HubSection id="quick-30" title="Кратко за 30 секунд">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {hub.quickFacts30.map((fact) => (
                    <div
                      key={fact.label}
                      className="rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/5 to-white p-4"
                    >
                      <span className="text-2xl" aria-hidden>
                        {fact.emoji}
                      </span>
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate">
                        {fact.label}
                      </p>
                      <p className="mt-1 font-display text-base font-bold text-charcoal">{fact.value}</p>
                    </div>
                  ))}
                </div>
              </HubSection>

              <HubSection id="planning" title="Планирование поездки" subtitle={hub.planning.intro}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {hub.planning.cards.map((card) => (
                    <article
                      key={card.title}
                      className="flex flex-col rounded-2xl border border-gray-100 bg-surface-muted/40 p-4 transition-shadow hover:shadow-md"
                    >
                      <span className="text-2xl" aria-hidden>
                        {card.emoji}
                      </span>
                      <h3 className="mt-2 font-display font-bold text-charcoal">{card.title}</h3>
                      <p className="mt-1 flex-1 text-sm leading-relaxed text-slate">{card.body}</p>
                      {card.href && card.linkLabel ? (
                        <Link
                          href={card.href}
                          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
                        >
                          {card.linkLabel}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </article>
                  ))}
                </div>
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
                          className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-4 transition-colors hover:border-sky/30 hover:bg-sky/5"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky/10 text-sky transition-colors group-hover:bg-sky group-hover:text-white">
                            <Icon className="h-5 w-5" aria-hidden />
                          </span>
                          <h3 className="mt-3 font-display font-bold text-charcoal group-hover:text-sky">
                            {topic.title}
                          </h3>
                          <p className="mt-1 flex-1 text-sm text-slate">{topic.description}</p>
                          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky">
                            Подробнее
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </HubSection>
              ))}

              <HubSection id="all-topics" title="Все темы путеводителя">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {hub.topicGroups.flatMap((group) => group.topics).map((topic) => {
                    const Icon = getGuideTopicIcon(topic.slug);
                    return (
                      <Link
                        key={`all-${topic.slug}`}
                        href={topic.href}
                        className="group flex items-start gap-3 rounded-2xl border border-gray-100 p-3 transition-colors hover:border-sky/30 hover:bg-sky/5"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky/10 text-sky transition-colors group-hover:bg-sky group-hover:text-white">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-charcoal group-hover:text-sky">
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
                className="scroll-mt-28 rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-8"
              >
                <h2 className="font-display text-xl font-bold text-charcoal">См. также</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {hub.relatedLinks.map((link) => (
                    <Link
                      key={link.href + link.title}
                      href={link.href}
                      className="group flex items-start justify-between gap-3 rounded-2xl border border-gray-100 p-4 transition-colors hover:border-sky/30 hover:bg-sky/5"
                    >
                      <span>
                        <span className="block font-medium text-charcoal group-hover:text-sky">
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

              <GuidePillarFaq
                items={hub.faq}
                intro="12 ответов о планировании поездки: сезоны, бюджет, визы, логистика и выбор между туром и самостоятельной поездкой."
              />

              <GuidePillarCta
                title="Готовы спланировать поездку?"
                subtitle="Подберите авторский тур, задайте вопрос менеджеру или изучите раздел об иммиграции, если планируете длительное пребывание."
              />
            </div>

            <HubToc items={hub.toc} variant="sidebar" />
          </div>
        </div>
      </div>
    </>
  );
}
