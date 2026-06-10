import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  Scale,
  Users,
} from "lucide-react";
import HubHero from "@/components/guide/hub/HubHero";
import ImmigrationSectionNav from "@/components/immigration/ImmigrationSectionNav";
import GuidePillarCta from "@/components/guide/GuidePillarCta";
import GuidePillarFaq from "@/components/guide/GuidePillarFaq";
import HubDataTable from "@/components/guide/hub/HubDataTable";
import HubSection from "@/components/guide/hub/HubSection";
import HubToc from "@/components/guide/hub/HubToc";
import FAQPageJsonLd from "@/components/seo/FAQPageJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buttonVariants } from "@/components/ui/button";
import { IMMIGRATION_HUB } from "@/data/immigration-hub-content";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

function HubTopicGrid({
  topics,
}: {
  topics: typeof IMMIGRATION_HUB.hubTopics;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map((topic) => (
        <Link
          key={topic.id}
          href={topic.href}
          className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-4 transition-colors hover:border-sky/30 hover:bg-sky/5"
        >
          <span className="text-2xl" aria-hidden>
            {topic.emoji}
          </span>
          <h3 className="mt-3 font-display font-bold text-charcoal group-hover:text-sky">
            {topic.title}
          </h3>
          <p className="mt-1 flex-1 text-sm text-slate">{topic.description}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky">
            Перейти
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}

function CardGrid({ cards }: { cards: typeof IMMIGRATION_HUB.lifeInCountry.cards }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
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
  );
}

function StepList({ steps }: { steps: typeof IMMIGRATION_HUB.citizenship.pathSteps }) {
  return (
    <ol className="space-y-4">
      {steps.map((step) => (
        <li
          key={step.step}
          className="flex gap-4 rounded-2xl border border-gray-100 bg-surface-muted/30 p-4 sm:p-5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky/10 font-display text-lg font-bold text-sky">
            {step.step}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="font-display font-bold text-charcoal">{step.title}</h3>
              {step.duration ? (
                <span className="rounded-full bg-charcoal/5 px-2 py-0.5 text-xs text-slate">
                  {step.duration}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function LinkGrid({ links }: { links: { title: string; href: string; description?: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {links.map((link) => (
        <Link
          key={link.href + link.title}
          href={link.href}
          target={link.href.startsWith("http") ? "_blank" : undefined}
          rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="group flex items-start justify-between gap-3 rounded-2xl border border-gray-100 p-4 transition-colors hover:border-sky/30 hover:bg-sky/5"
        >
          <span>
            <span className="block font-medium text-charcoal group-hover:text-sky">{link.title}</span>
            {link.description ? (
              <span className="mt-0.5 block text-xs text-slate">{link.description}</span>
            ) : null}
          </span>
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate group-hover:text-sky" />
        </Link>
      ))}
    </div>
  );
}

export default function ImmigrationHubView() {
  const hub = IMMIGRATION_HUB;
  const path = "/immigration";
  const process = hub.immigrationProcess;

  return (
    <>
      <WebPageJsonLd name={hub.heroTitle} description={hub.heroSubtitle} path={path} />
      <FAQPageJsonLd questions={hub.faq} path={path} />

      <HubHero
        title={hub.heroTitle}
        subtitle={hub.heroSubtitle}
        image={hub.heroImage}
        eyebrow={{ label: "Иммиграция" }}
        ctas={hub.heroCtas}
      />

      <ImmigrationSectionNav />

      <div className="bg-surface-muted pb-16">
        <div className={cn(siteContainerClass, "py-8 md:py-12")}>
          <nav className="text-sm text-slate" aria-label="Хлебные крошки">
            <Link href="/" className="transition-colors hover:text-sky">
              Главная
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-charcoal">Иммиграция</span>
          </nav>

          <div className="mt-8 lg:flex lg:items-start lg:gap-8 xl:gap-10">
            <div className="min-w-0 flex-1 space-y-8">
              <HubToc items={hub.toc} variant="mobile" />

              <HubSection id="quick-30" title="Кратко за 30 секунд">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

              <HubSection
                id="hub-overview"
                title="Разделы справочника"
                subtitle="Основные блоки — от жизни в стране до гражданства и полезных ссылок."
              >
                <HubTopicGrid topics={hub.hubTopics} />
              </HubSection>

              <HubSection
                id="life-in-country"
                title="Жизнь в стране"
                subtitle={hub.lifeInCountry.intro}
              >
                <CardGrid cards={hub.lifeInCountry.cards} />
              </HubSection>

              <HubSection
                id="immigration-process"
                title="Процесс иммиграции"
                subtitle={process.intro}
              >
                <h3 className="font-display text-lg font-bold text-charcoal">Въезд туриста</h3>
                <ul className="mt-3 space-y-2">
                  {process.touristRules.map((rule) => (
                    <li key={rule} className="flex gap-2 text-sm text-charcoal">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
                      {rule}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-xl border border-sky/15 bg-sky/5 px-4 py-3 text-sm leading-relaxed text-charcoal">
                  {process.statusChangeNote}
                </p>
                <Link
                  href={process.entryDocsHref}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
                >
                  {process.entryDocsLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="mt-8 rounded-2xl border border-amber-200/60 bg-amber-50/40 p-5">
                  <h3 className="font-display text-lg font-bold text-charcoal">{process.dnuTitle}</h3>
                  <ul className="mt-3 space-y-2">
                    {process.dnuChanges.map((change) => (
                      <li key={change} className="flex gap-2 text-sm text-charcoal">
                        <span className="text-amber-600" aria-hidden>
                          •
                        </span>
                        {change}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-slate">{process.dnuNote}</p>
                </div>

                <h3 className="mt-8 font-display text-lg font-bold text-charcoal">Процесс RADEX</h3>
                <ol className="mt-3 space-y-3">
                  {process.radexSteps.map((step) => (
                    <li
                      key={step.step}
                      className="flex gap-3 rounded-xl border border-gray-100 bg-white p-4"
                    >
                      <span className="font-display text-lg font-bold text-sky">{step.step}.</span>
                      <div>
                        <p className="font-medium text-charcoal">{step.title}</p>
                        <p className="mt-0.5 text-sm text-slate">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Link
                  href={process.radexPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline" }), "mt-6 rounded-full")}
                >
                  Открыть RADEX
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>

                <h3 className="mt-8 font-display text-lg font-bold text-charcoal">
                  Документы для residencia
                </h3>
                <p className="mt-2 text-sm text-slate">{process.documentsIntro}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {process.documentsChecklist.map((item) => (
                    <div
                      key={item.title}
                      className={cn(
                        "rounded-2xl border p-4",
                        item.required
                          ? "border-sky/20 bg-gradient-to-br from-sky/5 to-white"
                          : "border-gray-100 bg-surface-muted/40"
                      )}
                    >
                      <span className="text-2xl" aria-hidden>
                        {item.emoji}
                      </span>
                      <p className="mt-2 font-display font-bold text-charcoal">
                        {item.title}
                        {item.required ? (
                          <span className="ml-2 text-xs font-normal text-sky">обязательно</span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate">{item.description}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-5 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate">
                  <FileText className="mb-0.5 mr-1 inline h-4 w-4 text-sky" aria-hidden />
                  {process.apostilleNote}
                </p>
              </HubSection>

              <HubSection id="birth" title="Роды в Аргентине" subtitle={hub.birthInArgentina.intro}>
                <CardGrid cards={hub.birthInArgentina.cards} />
                <div className="mt-6">
                  <h3 className="font-display text-lg font-bold text-charcoal">Типичный порядок</h3>
                  <div className="mt-4">
                    <StepList steps={hub.birthInArgentina.steps} />
                  </div>
                </div>
                <aside className="mt-5 rounded-2xl border border-sky/20 bg-sky/5 p-4 text-sm text-charcoal">
                  {hub.birthInArgentina.note}
                </aside>
              </HubSection>

              <HubSection id="citizenship" title="Гражданство Аргентины" subtitle={hub.citizenship.intro}>
                <CardGrid cards={hub.citizenship.cards} />
                <div className="mt-6">
                  <h3 className="font-display text-lg font-bold text-charcoal">Путь к паспорту</h3>
                  <div className="mt-4">
                    <StepList steps={hub.citizenship.pathSteps} />
                  </div>
                </div>
                <aside className="mt-5 rounded-2xl border border-gray-100 bg-surface-muted/40 p-4 text-sm text-slate">
                  {hub.citizenship.note}
                </aside>
              </HubSection>

              <HubSection id="residency" title="ВНЖ и ПМЖ Аргентины" subtitle={hub.residency.intro}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {hub.residency.types.map((type) => (
                    <article
                      key={type.title}
                      className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-surface-muted/50 p-5"
                    >
                      <span className="text-3xl" aria-hidden>
                        {type.emoji}
                      </span>
                      <h3 className="mt-2 font-display text-lg font-bold text-charcoal">{type.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate">{type.body}</p>
                    </article>
                  ))}
                </div>
                <div className="mt-6">
                  <h3 className="font-display text-lg font-bold text-charcoal">
                    14 оснований для residencia temporaria
                  </h3>
                  <HubDataTable table={hub.residency.groundsTable} />
                </div>
                <Link
                  href={hub.residency.overviewHref}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
                >
                  {hub.residency.overviewLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </HubSection>

              <HubSection id="opportunities" title="Возможности" subtitle={hub.opportunities.intro}>
                <CardGrid cards={hub.opportunities.highlights} />
                <h3 className="mt-8 font-display text-lg font-bold text-charcoal">
                  Альтернативы в LatAm
                </h3>
                <p className="mt-2 text-sm text-slate">
                  Если Аргентина не подходит по срокам или налогам — сравните соседние юрисдикции.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {hub.opportunities.alternatives.map((alt) => (
                    <div
                      key={alt.title}
                      className="rounded-2xl border border-gray-100 bg-surface-muted/40 p-4"
                    >
                      <span className="text-2xl" aria-hidden>
                        {alt.emoji}
                      </span>
                      <p className="mt-2 font-display font-bold text-charcoal">{alt.title}</p>
                      <p className="mt-1 text-sm text-slate">{alt.body}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-surface-muted/40 p-5">
                    <Users className="h-8 w-8 text-sky" aria-hidden />
                    <h3 className="mt-3 font-display text-lg font-bold text-charcoal">
                      {hub.opportunities.diyTitle}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate">{hub.opportunities.diyBody}</p>
                  </div>
                  <div className="rounded-2xl border border-sky/25 bg-gradient-to-br from-sky/5 to-white p-5">
                    <Scale className="h-8 w-8 text-sky" aria-hidden />
                    <h3 className="mt-3 font-display text-lg font-bold text-charcoal">
                      {hub.opportunities.proTitle}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate">{hub.opportunities.proBody}</p>
                    <Link
                      href={hub.opportunities.contactsHref}
                      className={cn(buttonVariants({ variant: "default" }), "mt-4 rounded-full")}
                    >
                      {hub.opportunities.contactsLabel}
                    </Link>
                  </div>
                </div>
              </HubSection>

              <HubSection id="useful-links" title="Полезные ссылки" subtitle={hub.usefulLinks.intro}>
                <h3 className="font-display text-base font-bold text-charcoal">Официальные источники</h3>
                <div className="mt-3">
                  <LinkGrid links={hub.usefulLinks.official} />
                </div>
                <h3 className="mt-8 font-display text-base font-bold text-charcoal">Статьи</h3>
                <div className="mt-3">
                  <LinkGrid links={hub.usefulLinks.articles} />
                </div>
                <h3 className="mt-8 font-display text-base font-bold text-charcoal">Смежные разделы</h3>
                <div className="mt-3">
                  <LinkGrid links={hub.usefulLinks.related} />
                </div>
              </HubSection>

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

              <GuidePillarFaq
                items={hub.faq}
                intro="15 ответов о ВНЖ, RADEX, гражданстве, родах и правилах въезда."
              />

              <GuidePillarCta
                title="Остались вопросы об иммиграции?"
                subtitle="Запросите контакты партнёров или задайте вопрос о турах и платформе — мы не оказываем юридических услуг."
              />
            </div>

            <HubToc items={hub.toc} variant="sidebar" />
          </div>
        </div>
      </div>
    </>
  );
}
