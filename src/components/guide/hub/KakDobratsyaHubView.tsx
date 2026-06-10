import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  MapPin,
  Plane,
  Shield,
} from "lucide-react";
import GuideNextTopic from "@/components/guide/GuideNextTopic";
import GuideSectionNav from "@/components/guide/GuideSectionNav";
import HubHero from "@/components/guide/hub/HubHero";
import GuidePillarCta from "@/components/guide/GuidePillarCta";
import GuidePillarFaq from "@/components/guide/GuidePillarFaq";
import HubDataTable from "@/components/guide/hub/HubDataTable";
import HubQuickFactsGrid from "@/components/guide/hub/HubQuickFactsGrid";
import HubSection from "@/components/guide/hub/HubSection";
import HubToc from "@/components/guide/hub/HubToc";
import AirlineRouteCard from "@/components/guide/hub/AirlineRouteCard";
import DomesticAirlinesSection from "@/components/guide/hub/DomesticAirlinesSection";
import DomesticRoutesMapSection from "@/components/guide/hub/DomesticRoutesMapSection";
import GuideGuidedTransferBlock from "@/components/guide/hub/GuideGuidedTransferBlock";
import FAQPageJsonLd from "@/components/seo/FAQPageJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buttonVariants } from "@/components/ui/button";
import { KAK_DOBRATSYA_HUB } from "@/data/guide-hub-kak-dobratsya";
import { cn } from "@/lib/cn";
import { guideTopicHref } from "@/lib/guide-topics";
import { siteContainerClass } from "@/lib/site-container";
import type { GuideTopicPage } from "@/types/guide-topic";

type KakDobratsyaHubViewProps = {
  topic: GuideTopicPage;
};

export default function KakDobratsyaHubView({ topic }: KakDobratsyaHubViewProps) {
  const hub = KAK_DOBRATSYA_HUB;
  const path = guideTopicHref(topic.slug);

  return (
    <>
      <WebPageJsonLd name={hub.heroTitle} description={hub.heroSubtitle} path={path} />
      <FAQPageJsonLd questions={hub.faq} path={path} />

      <HubHero
        title={hub.heroTitle}
        subtitle={hub.heroSubtitle}
        image={hub.heroImage}
        eyebrow={{ label: "Путеводитель", href: "/guide" }}
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
            <Link href="/guide" className="transition-colors hover:text-sky">
              Путеводитель
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-charcoal">{topic.title}</span>
          </nav>

          <div className="mt-8 lg:flex lg:items-start lg:gap-8 xl:gap-10">
            <div className="min-w-0 flex-1 space-y-8">
              <HubToc items={hub.toc} variant="mobile" />

              <HubSection id="quick-30" title="Кратко за 30 секунд">
                <HubQuickFactsGrid facts={hub.quickFacts30} />
              </HubSection>

              <HubSection
                id="transport-modes"
                title="Как можно попасть в Аргентину"
                subtitle="Сравните способы — для большинства туристов из России и Европы оптимален перелёт с одной пересадкой."
              >
                <div className="space-y-6">
                  {hub.transportModes.map((mode) => (
                    <article
                      key={mode.id}
                      className={cn(
                        "rounded-2xl border p-5 sm:p-6",
                        mode.highlight
                          ? "border-sky/25 bg-gradient-to-br from-sky/5 to-white"
                          : "border-gray-100 bg-surface-muted/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl" aria-hidden>
                          {mode.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-xl font-bold text-charcoal">{mode.title}</h3>
                          <p className="mt-2 text-sm leading-relaxed text-slate">{mode.summary}</p>
                          {mode.note ? (
                            <p className="mt-2 text-sm text-slate/80">{mode.note}</p>
                          ) : null}

                          {mode.airlineIntro ? (
                            <p className="mt-3 rounded-lg border border-sky/15 bg-white/80 px-3 py-2.5 text-xs leading-relaxed text-slate">
                              {mode.airlineIntro}
                            </p>
                          ) : null}

                          {mode.airlines ? (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {mode.airlines.map((airline) => (
                                <AirlineRouteCard key={airline.name} airline={airline} />
                              ))}
                            </div>
                          ) : null}

                          {mode.borderCountries ? (
                            <div className="mt-4">
                              <p className="text-sm font-medium text-charcoal">Въезд на авто из:</p>
                              <ul className="mt-2 flex flex-wrap gap-2">
                                {mode.borderCountries.map((c) => (
                                  <li key={c.country}>
                                    {c.href ? (
                                      <Link
                                        href={c.href}
                                        className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-charcoal hover:border-sky/40 hover:text-sky"
                                      >
                                        {c.country}
                                      </Link>
                                    ) : (
                                      <span className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-charcoal">
                                        {c.country}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </HubSection>

              <HubSection
                id="aviasales"
                title="Поиск авиабилетов"
                subtitle="Сравните цены и маршруты до Buenos Aires (EZE) — гибкий календарь помогает сэкономить."
              >
                <div className="overflow-hidden rounded-3xl border border-sky/20 bg-gradient-to-br from-sky/10 via-white to-sky/5 p-6 sm:p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2 text-sky">
                        <Plane className="h-6 w-6" aria-hidden />
                        <span className="font-display text-lg font-bold text-charcoal">Aviasales</span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate">
                        Встроенный поиск маршрутов в Буэнос-Айрес и региональные аэропорты. Сравнивайте
                        пересадки в Стамбуле, Мадриде, Дохе и Сан-Паулу.
                      </p>
                      <ul className="mt-4 space-y-2">
                        {hub.aviasalesBenefits.map((benefit) => (
                          <li key={benefit} className="flex items-start gap-2 text-sm text-charcoal">
                            <span className="text-sky">✔</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href="https://www.aviasales.ru/?origin=MOW&destination=BUE"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: "default" }), "rounded-full px-8 py-6 text-base")}
                    >
                      Найти билеты
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </HubSection>

              <HubSection
                id="airports"
                title="Главные аэропорты Аргентины"
                subtitle="Интерактивная карта — ключевые точки въезда и внутренних перелётов."
              >
                <div className="mb-6 rounded-2xl border border-dashed border-sky/30 bg-sky/5 p-8 text-center">
                  <MapPin className="mx-auto h-10 w-10 text-sky/60" aria-hidden />
                  <p className="mt-3 font-display text-sm font-semibold text-charcoal">
                    Карта аэропортов — скоро
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    EZE и AEP — главные точки; региональные хабы ниже
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {hub.airports.map((airport) => (
                    <div
                      key={airport.code}
                      className="rounded-2xl border border-gray-100 bg-surface-muted/40 p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl" aria-hidden>
                          {airport.emoji}
                        </span>
                        <div>
                          <p className="font-display font-bold text-charcoal">
                            {airport.city}{" "}
                            <span className="rounded-md bg-charcoal/5 px-1.5 py-0.5 text-sm font-mono text-sky">
                              {airport.code}
                            </span>
                          </p>
                          <p className="text-xs text-slate">{airport.name}</p>
                          <p className="mt-2 text-sm leading-relaxed text-slate">{airport.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </HubSection>

              <HubSection id="domestic-airlines" title="Внутренние авиалинии" subtitle={hub.domesticAirlinesIntro}>
                <DomesticAirlinesSection airlines={hub.domesticAirlines} />
              </HubSection>

              <HubSection
                id="domestic-routes"
                title="Как летают внутренние рейсы"
                subtitle={hub.domesticRoutesIntro}
              >
                <DomesticRoutesMapSection />
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[400px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-2 font-semibold text-charcoal">Маршрут</th>
                        <th className="pb-2 font-semibold text-charcoal">Сезонность</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hub.seasonalRoutes.map((row) => (
                        <tr key={row.route} className="border-b border-gray-50">
                          <td className="py-3 font-medium text-charcoal">{row.route}</td>
                          <td className="py-3 text-slate">{row.season}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <aside className="mt-6 rounded-2xl border border-sky/20 bg-sky/5 p-4 text-sm text-charcoal">
                  {hub.patagoniaNote}
                </aside>
              </HubSection>

              <HubSection id="entry-docs" title="Документы и правила въезда" subtitle={hub.entryDocsIntro}>
                {hub.entryVisaFree ? (
                  <div className="rounded-2xl border border-sky/20 bg-sky/5 p-4 sm:p-5">
                    <p className="font-display font-bold text-charcoal">{hub.entryVisaFree.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate">{hub.entryVisaFree.summary}</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate">{hub.entryVisaFree.countriesNote}</p>
                    <ul className="mt-3 space-y-1.5">
                      {hub.entryVisaFree.rules.map((rule) => (
                        <li key={rule} className="flex gap-2 text-sm text-charcoal">
                          <span className="text-sky" aria-hidden>
                            •
                          </span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {hub.entryDocs.map((doc) => (
                    <div key={doc.title} className="rounded-2xl border border-gray-100 bg-surface-muted/40 p-4">
                      <span className="text-2xl" aria-hidden>
                        {doc.emoji}
                      </span>
                      <p className="mt-2 font-display font-bold text-charcoal">{doc.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate">{doc.description}</p>
                    </div>
                  ))}
                </div>

                {hub.entryHealthcare ? (
                  <aside className="mt-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 sm:p-5">
                    <p className="font-display font-bold text-charcoal">{hub.entryHealthcare.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-charcoal">{hub.entryHealthcare.body}</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {hub.entryHealthcare.emergencyNumbers.map((num) => (
                        <li
                          key={num}
                          className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-charcoal"
                        >
                          {num}
                        </li>
                      ))}
                    </ul>
                  </aside>
                ) : null}

                {hub.entryFunds ? (
                  <p className="mt-4 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate">
                    <span className="font-semibold text-charcoal">Средства на поездку: </span>
                    {hub.entryFunds}
                  </p>
                ) : null}

                <div className="mt-6 space-y-3">
                  {hub.entryWarnings.map((warning) => (
                    <aside
                      key={warning}
                      className="flex gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4"
                    >
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                      <p className="text-sm text-charcoal">{warning}</p>
                    </aside>
                  ))}
                </div>
                <Link
                  href="/immigration"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
                >
                  Полный справочник по иммиграции
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </HubSection>

              <HubSection id="insurance" title="Страховка">
                <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gradient-to-br from-emerald-50/50 to-white p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <Shield className="h-10 w-10 shrink-0 text-emerald-600" aria-hidden />
                    <div>
                      <p className="font-display font-bold text-charcoal">{hub.insurance.title}</p>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">{hub.insurance.body}</p>
                    </div>
                  </div>
                  <Link
                    href={hub.insurance.href}
                    className={cn(buttonVariants({ variant: "outline" }), "shrink-0 rounded-full")}
                  >
                    {hub.insurance.ctaLabel}
                  </Link>
                </div>
              </HubSection>

              <HubSection id="transfers" title="Трансферы из аэропортов">
                <div className="space-y-8">
                  {hub.guidedAirportTransfers ? (
                    <GuideGuidedTransferBlock block={hub.guidedAirportTransfers} />
                  ) : null}
                  {hub.transferTables.map((block) => (
                    <div key={block.id}>
                      <h3 className="mb-4 font-display text-lg font-bold text-charcoal">{block.title}</h3>
                      <HubDataTable table={block.table} />
                    </div>
                  ))}
                </div>
              </HubSection>

              <HubSection id="eze-aep" title="EZE ↔ AEP — пересадка между аэропортами">
                <p className="mb-4 text-sm text-slate">
                  Многие туристы прилетают в EZE, а внутренний рейс вылетает из AEP (или наоборот).
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-surface-muted/60 p-4">
                    <p className="text-xs text-slate">Расстояние</p>
                    <p className="mt-1 font-semibold text-charcoal">{hub.ezeAepTransfer.distance}</p>
                  </div>
                  <div className="rounded-xl bg-surface-muted/60 p-4">
                    <p className="text-xs text-slate">Время в пути</p>
                    <p className="mt-1 font-semibold text-charcoal">{hub.ezeAepTransfer.duration}</p>
                  </div>
                  <div className="rounded-xl bg-surface-muted/60 p-4">
                    <p className="text-xs text-slate">Такси</p>
                    <p className="mt-1 font-semibold text-charcoal">{hub.ezeAepTransfer.taxiCost}</p>
                  </div>
                  <div className="rounded-xl bg-surface-muted/60 p-4">
                    <p className="text-xs text-slate">Трансфер</p>
                    <p className="mt-1 font-semibold text-charcoal">{hub.ezeAepTransfer.transferCost}</p>
                  </div>
                </div>
                <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-slate">
                  {hub.ezeAepTransfer.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
                <Link
                  href="/contacts?service=airport-transfer"
                  className={cn(buttonVariants({ variant: "default" }), "mt-6 rounded-full")}
                >
                  Заказать трансфер EZE ↔ AEP
                </Link>
              </HubSection>

              <HubSection id="tips" title="Полезные советы">
                <div className="grid gap-4 sm:grid-cols-2">
                  {hub.tips.map((tip) => (
                    <div key={tip.title} className="rounded-2xl border border-gray-100 p-4">
                      <span className="text-2xl" aria-hidden>
                        {tip.emoji}
                      </span>
                      <p className="mt-2 font-display font-bold text-charcoal">{tip.title}</p>
                      <p className="mt-1 text-sm text-slate">{tip.body}</p>
                    </div>
                  ))}
                </div>
              </HubSection>

              <HubSection id="articles" title="Читайте также">
                <div className="grid gap-3 sm:grid-cols-2">
                  {hub.articles.map((article) => (
                    <Link
                      key={article.href + article.title}
                      href={article.href}
                      className="group flex items-start justify-between gap-3 rounded-2xl border border-gray-100 p-4 transition-colors hover:border-sky/30 hover:bg-sky/5"
                    >
                      <span>
                        <span className="block font-medium text-charcoal group-hover:text-sky">
                          {article.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate">{article.description}</span>
                      </span>
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate group-hover:text-sky" />
                    </Link>
                  ))}
                </div>
              </HubSection>

              <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-8">
                <h2 className="font-display text-xl font-bold text-charcoal">Рекомендуем</h2>
                <p className="mt-2 text-sm text-slate">
                  Полезные сервисы — без агрессивной рекламы, только то, что реально помогает в поездке.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {hub.monetization.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="rounded-2xl border border-gray-100 bg-surface-muted/30 p-4 transition-colors hover:border-sky/30 hover:bg-sky/5"
                    >
                      <span className="text-2xl" aria-hidden>
                        {item.emoji}
                      </span>
                      <p className="mt-2 font-medium text-charcoal">{item.title}</p>
                      <p className="mt-1 text-xs text-slate">{item.description}</p>
                    </Link>
                  ))}
                </div>
              </section>

              <GuidePillarFaq
                items={hub.faq}
                intro="25 ответов о перелётах, аэропортах, трансферах и документах — для туристов и планирующих длительное пребывание."
              />

              <GuideNextTopic slug={topic.slug} />

              <GuidePillarCta
                title="Остались вопросы о дороге в Аргентину?"
                subtitle="Поможем с перелётами, трансферами EZE/AEP и стыковками в Patagonia."
              />
            </div>

            <HubToc items={hub.toc} variant="sidebar" />
          </div>
        </div>
      </div>
    </>
  );
}
