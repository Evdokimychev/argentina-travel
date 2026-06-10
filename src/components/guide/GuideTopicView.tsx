import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  MapPin,
  Sparkles,
} from "lucide-react";
import Hero from "@/components/Hero";
import ArgentinaExchangeRates from "@/components/guide/ArgentinaExchangeRates";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import type { GuideTopicPage } from "@/types/guide-topic";

interface GuideTopicViewProps {
  topic: GuideTopicPage;
}

function tourHref(rec: { href: string; query?: string }): string {
  if (rec.query) {
    return `/tours?query=${encodeURIComponent(rec.query)}`;
  }
  return rec.href;
}

export default function GuideTopicView({ topic }: GuideTopicViewProps) {
  const heroImage =
    topic.heroImage ??
    "https://images.unsplash.com/photo-1483728642387-6bc3bd38dafc?w=1920&q=80";

  return (
    <>
      <Hero title={topic.title} subtitle={topic.shortDescription} image={heroImage} compact />

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

          {topic.features?.exchangeRates ? <ArgentinaExchangeRates /> : null}

          <article className="prose-legal mt-10 max-w-3xl space-y-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            {topic.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-display text-xl font-bold text-charcoal">{section.heading}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate">{section.body}</p>
              </section>
            ))}
          </article>

          {topic.serviceCards && topic.serviceCards.length > 0 ? (
            <section className="mt-12">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sky" aria-hidden />
                <h2 className="font-display text-xl font-bold text-charcoal">Рекомендуем</h2>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topic.serviceCards.map((card) => (
                  <Link
                    key={card.href + card.title}
                    href={card.href}
                    target={card.external ? "_blank" : undefined}
                    rel={card.external ? "noopener noreferrer" : undefined}
                    className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-colors hover:border-sky/30 hover:bg-sky/5"
                  >
                    <span className="font-display text-base font-bold text-charcoal group-hover:text-sky">
                      {card.title}
                    </span>
                    <span className="mt-2 flex-1 text-sm text-slate">{card.description}</span>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky">
                      {card.ctaLabel}
                      {card.external ? (
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {topic.tourRecommendations && topic.tourRecommendations.length > 0 ? (
            <section className="mt-12">
              <h2 className="font-display text-xl font-bold text-charcoal">Туры по теме</h2>
              <ul className="mt-4 flex flex-wrap gap-3">
                {topic.tourRecommendations.map((rec) => (
                  <li key={rec.label}>
                    <Link
                      href={tourHref(rec)}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "rounded-full border-gray-200 bg-white px-4 py-2 text-sm hover:border-sky/40 hover:bg-sky/5"
                      )}
                    >
                      {rec.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {topic.relatedArticles && topic.relatedArticles.length > 0 ? (
            <section className="mt-12 max-w-3xl">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-sky" aria-hidden />
                <h2 className="font-display text-xl font-bold text-charcoal">Читать подробнее</h2>
              </div>
              <ul className="mt-4 space-y-2">
                {topic.relatedArticles.map((article) => (
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
          ) : null}

          {topic.relatedDestinations && topic.relatedDestinations.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-lg font-bold text-charcoal">Направления</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {topic.relatedDestinations.map((dest) => (
                  <li key={dest.href}>
                    <Link
                      href={dest.href}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
                    >
                      <MapPin className="h-3.5 w-3.5 text-slate" aria-hidden />
                      {dest.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="mt-12 max-w-3xl rounded-2xl bg-patagonia/5 p-6 text-center sm:p-8">
            <p className="font-display text-lg font-bold text-charcoal">
              Готовы спланировать поездку?
            </p>
            <p className="mt-2 text-sm text-slate">
              Авторские туры от организаторов или персональная консультация
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/tours" className={cn(buttonVariants(), "rounded-full px-6")}>
                Каталог туров
              </Link>
              <Link
                href="/contacts"
                className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-6")}
              >
                Связаться с нами
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
