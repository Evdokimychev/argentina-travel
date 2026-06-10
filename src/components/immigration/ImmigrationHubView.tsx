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

export default function ImmigrationHubView() {
  const hub = IMMIGRATION_HUB;
  const path = "/immigration";

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

              <HubSection
                id="why-argentina"
                title="Почему Аргентина для релокации"
                subtitle={hub.whyArgentina.intro}
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {hub.whyArgentina.cards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-2xl border border-gray-100 bg-surface-muted/40 p-4 transition-shadow hover:shadow-md"
                    >
                      <span className="text-2xl" aria-hidden>
                        {card.emoji}
                      </span>
                      <p className="mt-2 font-display font-bold text-charcoal">{card.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate">{card.body}</p>
                    </div>
                  ))}
                </div>
              </HubSection>

              <HubSection
                id="tourist-entry"
                title="Въезд туриста и смена статуса"
                subtitle={hub.touristEntry.intro}
              >
                <ul className="space-y-2">
                  {hub.touristEntry.rules.map((rule) => (
                    <li key={rule} className="flex gap-2 text-sm text-charcoal">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
                      {rule}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-xl border border-sky/15 bg-sky/5 px-4 py-3 text-sm leading-relaxed text-charcoal">
                  {hub.touristEntry.statusChangeNote}
                </p>
                <Link
                  href={hub.touristEntry.linkHref}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
                >
                  {hub.touristEntry.linkLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </HubSection>

              <HubSection
                id="residency-types"
                title="Виды резиденции"
                subtitle={hub.residencyTypes.intro}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {hub.residencyTypes.types.map((type) => (
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
              </HubSection>

              <HubSection
                id="grounds-14"
                title="14 оснований для residencia temporaria"
                subtitle="Официальные категории Migraciones — выберите подходящую и сверьте актуальные требования на портале."
              >
                <HubDataTable table={hub.groundsTable} />
                <Link
                  href="/immigration/obzor-vnzh"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
                >
                  Подробный обзор видов ВНЖ
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </HubSection>

              <HubSection
                id="path-steps"
                title="Путь к гражданству"
                subtitle={hub.residencyPath.intro}
              >
                <ol className="space-y-4">
                  {hub.residencyPath.steps.map((step) => (
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
                <aside className="mt-5 rounded-2xl border border-sky/20 bg-sky/5 p-4 text-sm text-charcoal">
                  {hub.residencyPath.citizenshipNote}
                </aside>
              </HubSection>

              <HubSection id="dnu-2025" title={hub.dnu2025.title} subtitle={hub.dnu2025.intro}>
                <ul className="space-y-2">
                  {hub.dnu2025.changes.map((change) => (
                    <li key={change} className="flex gap-2 text-sm text-charcoal">
                      <span className="text-sky" aria-hidden>
                        •
                      </span>
                      {change}
                    </li>
                  ))}
                </ul>
                {hub.dnu2025.note ? (
                  <p className="mt-4 text-sm text-slate">{hub.dnu2025.note}</p>
                ) : null}
                <Link
                  href="/immigration/dokumenty-dlya-vyezda"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
                >
                  Чеклист документов для въезда
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </HubSection>

              <HubSection id="documents" title="Документы для residencia" subtitle={hub.documents.intro}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {hub.documents.checklist.map((item) => (
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
                  {hub.documents.apostilleNote}
                </p>
              </HubSection>

              <HubSection id="radex-process" title="Процесс RADEX" subtitle={hub.radexProcess.intro}>
                <ol className="space-y-3">
                  {hub.radexProcess.steps.map((step) => (
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
                  href={hub.radexProcess.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline" }), "mt-6 rounded-full")}
                >
                  Открыть портал Migraciones
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </HubSection>

              <HubSection id="articles" title="Статьи по иммиграции">
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

              <HubSection
                id="alternatives"
                title="Самостоятельно или с помощью"
                subtitle="Оба пути легальны — выбор зависит от времени, языка и сложности вашего основания."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-surface-muted/40 p-5">
                    <Users className="h-8 w-8 text-sky" aria-hidden />
                    <h3 className="mt-3 font-display text-lg font-bold text-charcoal">
                      {hub.alternatives.diyTitle}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate">{hub.alternatives.diyBody}</p>
                  </div>
                  <div className="rounded-2xl border border-sky/25 bg-gradient-to-br from-sky/5 to-white p-5">
                    <Scale className="h-8 w-8 text-sky" aria-hidden />
                    <h3 className="mt-3 font-display text-lg font-bold text-charcoal">
                      {hub.alternatives.proTitle}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate">{hub.alternatives.proBody}</p>
                    <Link
                      href={hub.alternatives.contactsHref}
                      className={cn(buttonVariants({ variant: "default" }), "mt-4 rounded-full")}
                    >
                      {hub.alternatives.contactsLabel}
                    </Link>
                  </div>
                </div>
              </HubSection>

              <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-8">
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
                intro="20 ответов о ВНЖ, RADEX, гражданстве и правилах въезда — для туристов и планирующих релокацию."
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
