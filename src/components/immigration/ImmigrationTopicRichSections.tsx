import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Scale,
  Users,
} from "lucide-react";
import HubSection from "@/components/guide/hub/HubSection";
import HubDataTable from "@/components/guide/hub/HubDataTable";
import {
  IMMIGRATION_BIRTH,
  IMMIGRATION_CITIZENSHIP,
  IMMIGRATION_LIFE_IN_COUNTRY,
  IMMIGRATION_OPPORTUNITIES,
  IMMIGRATION_PROCESS,
  IMMIGRATION_RESIDENCY,
  IMMIGRATION_USEFUL_LINKS,
} from "@/data/immigration-topic-content";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  ImmigrationCardGrid,
  ImmigrationChecklistGrid,
  ImmigrationFaqList,
  ImmigrationGroundsTable,
  ImmigrationHistoryTimeline,
  ImmigrationLinkGrid,
  ImmigrationMistakesList,
  ImmigrationStepList,
  ImmigrationWasNowGrid,
} from "@/components/immigration/ImmigrationContentBlocks";
import type { ImmigrationTopicSlug } from "@/data/immigration-topics";

type ImmigrationTopicRichSectionsProps = {
  slug: ImmigrationTopicSlug;
};

export default function ImmigrationTopicRichSections({ slug }: ImmigrationTopicRichSectionsProps) {
  switch (slug) {
    case "zhizn-v-strane":
      return (
        <HubSection id="life-cards" title="Аспекты жизни">
          <ImmigrationCardGrid cards={IMMIGRATION_LIFE_IN_COUNTRY.cards} />
        </HubSection>
      );

    case "protsess-immigratsii": {
      const process = IMMIGRATION_PROCESS;
      return (
        <>
          <HubSection id="tourist-entry" title="Въезд туриста">
            <ul className="space-y-2">
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
            </Link>
          </HubSection>

          <HubSection id="dnu" title={process.dnuTitle}>
            <ul className="space-y-2">
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
          </HubSection>

          <HubSection id="radex" title="Процесс RADEX">
            <ImmigrationStepList steps={process.radexSteps} />
            <Link
              href={process.radexPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline" }), "mt-6 rounded-full")}
            >
              Открыть RADEX
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </HubSection>

          <HubSection id="documents" title="Документы для ВНЖ">
            <p className="text-sm text-slate">{process.documentsIntro}</p>
            <div className="mt-4">
              <ImmigrationChecklistGrid items={process.documentsChecklist} />
            </div>
            <p className="mt-5 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate">
              <FileText className="mb-0.5 mr-1 inline h-4 w-4 text-sky" aria-hidden />
              {process.apostilleNote}
            </p>
          </HubSection>
        </>
      );
    }

    case "rody-v-argentine":
      return (
        <>
          <HubSection id="birth-cards" title="Ключевые моменты">
            <ImmigrationCardGrid cards={IMMIGRATION_BIRTH.cards} />
          </HubSection>
          <HubSection id="birth-steps" title="Типичный порядок">
            <ImmigrationStepList steps={IMMIGRATION_BIRTH.steps} />
            <aside className="mt-5 rounded-2xl border border-sky/20 bg-sky/5 p-4 text-sm text-charcoal">
              {IMMIGRATION_BIRTH.note}
            </aside>
          </HubSection>
        </>
      );

    case "grazhdanstvo": {
      const citizenship = IMMIGRATION_CITIZENSHIP;
      return (
        <>
          <aside className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
            {citizenship.dnuWarning}
          </aside>

          <HubSection id="citizenship-cards" title="Что даёт гражданство">
            <ImmigrationCardGrid cards={citizenship.cards} />
          </HubSection>

          <HubSection id="citizenship-grounds" title="Основания для получения">
            <ImmigrationCardGrid cards={citizenship.grounds} />
            <p className="mt-4 text-sm leading-relaxed text-slate">{citizenship.groundsNote}</p>
            <p className="mt-3 rounded-xl border border-sky/15 bg-sky/5 px-4 py-3 text-sm leading-relaxed text-charcoal">
              {citizenship.expeditedNote}
            </p>
          </HubSection>

          <HubSection id="citizenship-documents" title="Документы">
            <p className="text-sm text-slate">{citizenship.documentsIntro}</p>
            <div className="mt-4">
              <ImmigrationChecklistGrid items={citizenship.documentsChecklist} />
            </div>
            <p className="mt-5 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate">
              <Scale className="mb-0.5 mr-1 inline h-4 w-4 text-sky" aria-hidden />
              {citizenship.specialDocumentsNote}
            </p>
          </HubSection>

          <HubSection id="citizenship-submission" title="Подача заявления">
            <p className="text-sm text-slate">{citizenship.submissionIntro}</p>
            <ol className="mt-4 space-y-3">
              {citizenship.submissionSteps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-charcoal">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky/10 text-xs font-bold text-sky">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm text-slate">
              Официальные источники:{" "}
              {citizenship.submissionLinks.map((link, index) => (
                <span key={link.href}>
                  {index > 0 ? " · " : null}
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sky hover:underline"
                  >
                    {link.label}
                  </a>
                </span>
              ))}
            </p>
          </HubSection>

          <HubSection id="citizenship-path" title="Сроки и этапы">
            <ImmigrationStepList steps={citizenship.pathSteps} />
            <p className="mt-5 rounded-xl border border-gray-100 bg-surface-muted/40 px-4 py-3 text-sm leading-relaxed text-slate">
              {citizenship.timelinesNote}
            </p>
            <aside className="mt-4 rounded-2xl border border-gray-100 bg-surface-muted/40 p-4 text-sm text-slate">
              {citizenship.note}
            </aside>
          </HubSection>
        </>
      );
    }

    case "vnzh-i-pmzh": {
      const residency = IMMIGRATION_RESIDENCY;
      return (
        <>
          <aside className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
            {residency.dnuWarning}
          </aside>

          <HubSection id="residency-types" title="Типы статуса">
            <ImmigrationCardGrid cards={residency.types} />
          </HubSection>

          <HubSection id="residency-history" title={residency.historyTitle}>
            <p className="text-sm text-slate">{residency.historyIntro}</p>
            <div className="mt-4">
              <ImmigrationHistoryTimeline events={residency.history} />
            </div>
          </HubSection>

          <HubSection id="residency-comparison" title={residency.comparisonTitle}>
            <HubDataTable table={residency.comparison} />
            <div className="mt-6">
              <h3 className="mb-3 font-heading text-base font-bold text-charcoal">
                {residency.statusComparisonTitle}
              </h3>
              <HubDataTable table={residency.statusComparison} />
            </div>
          </HubSection>

          <HubSection id="residency-roadmap" title={residency.roadmapTitle}>
            <p className="text-sm text-slate">{residency.roadmapIntro}</p>
            <div className="mt-4">
              <ImmigrationStepList steps={residency.roadmap} />
            </div>
          </HubSection>

          <HubSection id="residency-grounds" title="15 оснований для временного ВНЖ">
            <p className="mb-4 text-sm text-slate">
              Ст. 23 Ley 25.871 (incisos a–ñ). Цифровой кочевник — transitoria по Disposición 758/2022, не входит в эту таблицу.
            </p>
            <ImmigrationGroundsTable grounds={residency.grounds} />
            <Link
              href={residency.overviewHref}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
            >
              {residency.overviewLabel}
            </Link>
          </HubSection>

          <HubSection id="pmzh-grounds" title="Основания для ПМЖ">
            <p className="text-sm text-slate">{residency.pmzhIntro}</p>
            <div className="mt-4">
              <ImmigrationGroundsTable grounds={residency.pmzhGrounds} />
            </div>
          </HubSection>

          <HubSection id="residency-documents" title="Документы для ВНЖ">
            <p className="text-sm text-slate">{residency.documentsIntro}</p>
            <div className="mt-4">
              <ImmigrationChecklistGrid items={residency.documentsChecklist} />
            </div>
            <p className="mt-5 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate">
              {residency.documentsNote}
            </p>
          </HubSection>

          <HubSection id="pmzh-documents" title="Документы для ПМЖ">
            <p className="text-sm text-slate">{residency.pmzhDocumentsIntro}</p>
            <div className="mt-4">
              <ImmigrationChecklistGrid items={residency.pmzhDocumentsChecklist} />
            </div>
          </HubSection>

          <HubSection id="residency-renewal" title="Продление ВНЖ">
            <p className="text-sm text-slate">{residency.renewalIntro}</p>
            <div className="mt-4">
              <ImmigrationStepList steps={residency.renewalSteps} />
            </div>
            <ul className="mt-4 space-y-2">
              {residency.renewalNotes.map((note) => (
                <li key={note} className="flex gap-2 text-sm text-charcoal">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
                  {note}
                </li>
              ))}
            </ul>
          </HubSection>

          <HubSection id="residency-absence" title="Отсутствие за границей">
            <p className="text-sm text-slate">{residency.absenceRulesIntro}</p>
            <div className="mt-4">
              <HubDataTable table={residency.absenceRules} />
            </div>
          </HubSection>

          <HubSection id="residency-loss" title="Потеря статуса и отказ">
            <p className="text-sm text-slate">{residency.lossOfStatusIntro}</p>
            <ul className="mt-4 space-y-2">
              {residency.lossOfStatus.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-charcoal">
                  <span className="text-amber-600" aria-hidden>
                    •
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </HubSection>

          <HubSection id="path-citizenship" title={residency.pathToCitizenshipTitle}>
            <ImmigrationStepList steps={residency.pathToCitizenship} />
            <Link
              href="/immigration/grazhdanstvo"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
            >
              Подробнее о гражданстве
            </Link>
          </HubSection>

          <HubSection id="residency-was-now" title={residency.wasNowTitle}>
            <p className="text-sm text-slate">{residency.wasNowIntro}</p>
            <div className="mt-4">
              <ImmigrationWasNowGrid items={residency.wasNow} />
            </div>
          </HubSection>

          <HubSection id="residency-costs" title="Стоимость и пошлины">
            <p className="text-sm text-slate">{residency.costsIntro}</p>
            <div className="mt-4">
              <ImmigrationChecklistGrid items={residency.costs} />
            </div>
            <p className="mt-5 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3 text-sm leading-relaxed text-charcoal">
              {residency.costsNote}
            </p>
          </HubSection>

          <HubSection id="residency-mistakes" title={residency.typicalMistakesTitle}>
            <ImmigrationMistakesList mistakes={residency.typicalMistakes} />
          </HubSection>

          <HubSection id="residency-faq" title="Частые вопросы по ВНЖ и ПМЖ">
            <ImmigrationFaqList items={residency.extendedFaq} />
          </HubSection>

          <HubSection id="residency-links" title="Смежные разделы">
            <ImmigrationLinkGrid links={residency.crossLinks} />
            <aside className="mt-5 rounded-2xl border border-gray-100 bg-surface-muted/40 p-4 text-sm text-slate">
              {residency.note}
            </aside>
          </HubSection>
        </>
      );
    }

    case "vozmozhnosti": {
      const opp = IMMIGRATION_OPPORTUNITIES;
      return (
        <>
          <HubSection id="opportunities-highlights" title="Основания под ваш профиль">
            <ImmigrationCardGrid cards={opp.highlights} />
          </HubSection>
          <HubSection id="opportunities-alternatives" title="Альтернативы в Латинской Америке">
            <p className="text-sm text-slate">
              Если Аргентина не подходит по срокам или налогам — сравните соседние юрисдикции.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {opp.alternatives.map((alt) => (
                <div
                  key={alt.title}
                  className="rounded-2xl border border-gray-100 bg-surface-muted/40 p-4"
                >
                  <span className="text-2xl" aria-hidden>
                    {alt.emoji}
                  </span>
                  <p className="mt-2 font-heading font-bold text-charcoal">{alt.title}</p>
                  <p className="mt-1 text-sm text-slate">{alt.body}</p>
                </div>
              ))}
            </div>
          </HubSection>
          <HubSection id="opportunities-support" title="Самостоятельно или с сопровождением">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-surface-muted/40 p-5">
                <Users className="h-8 w-8 text-sky" aria-hidden />
                <h3 className="mt-3 font-heading text-lg font-bold text-charcoal">{opp.diyTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{opp.diyBody}</p>
              </div>
              <div className="rounded-2xl border border-sky/25 bg-gradient-to-br from-sky/5 to-white p-5">
                <Scale className="h-8 w-8 text-sky" aria-hidden />
                <h3 className="mt-3 font-heading text-lg font-bold text-charcoal">{opp.proTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{opp.proBody}</p>
                <Link
                  href={opp.contactsHref}
                  className={cn(buttonVariants({ variant: "default" }), "mt-4 rounded-full")}
                >
                  {opp.contactsLabel}
                </Link>
              </div>
            </div>
          </HubSection>
        </>
      );
    }

    case "poleznye-ssylki": {
      const links = IMMIGRATION_USEFUL_LINKS;
      return (
        <>
          <HubSection id="official-links" title="Официальные источники">
            <ImmigrationLinkGrid links={links.official} />
          </HubSection>
          <HubSection id="article-links" title="Статьи">
            <ImmigrationLinkGrid links={links.articles} />
          </HubSection>
          <HubSection id="related-links" title="Смежные разделы">
            <ImmigrationLinkGrid links={links.related} />
          </HubSection>
        </>
      );
    }

    default:
      return null;
  }
}

export function getImmigrationTopicTocExtras(slug: ImmigrationTopicSlug): { id: string; label: string }[] {
  switch (slug) {
    case "zhizn-v-strane":
      return [{ id: "life-cards", label: "Аспекты жизни" }];
    case "protsess-immigratsii":
      return [
        { id: "tourist-entry", label: "Въезд туриста" },
        { id: "dnu", label: "Decreto 366/2025" },
        { id: "radex", label: "RADEX" },
        { id: "documents", label: "Документы" },
      ];
    case "rody-v-argentine":
      return [
        { id: "birth-cards", label: "Ключевые моменты" },
        { id: "birth-steps", label: "Типичный порядок" },
      ];
    case "grazhdanstvo":
      return [
        { id: "citizenship-cards", label: "Что даёт гражданство" },
        { id: "citizenship-grounds", label: "Основания" },
        { id: "citizenship-documents", label: "Документы" },
        { id: "citizenship-submission", label: "Подача заявления" },
        { id: "citizenship-path", label: "Сроки и этапы" },
      ];
    case "vnzh-i-pmzh":
      return [
        { id: "residency-types", label: "Типы статуса" },
        { id: "residency-history", label: "История политики" },
        { id: "residency-comparison", label: "Сравнение" },
        { id: "residency-roadmap", label: "Дорожная карта" },
        { id: "residency-grounds", label: "Основания ВНЖ" },
        { id: "pmzh-grounds", label: "Основания ПМЖ" },
        { id: "residency-documents", label: "Документы ВНЖ" },
        { id: "residency-renewal", label: "Продление" },
        { id: "residency-absence", label: "Отсутствие" },
        { id: "path-citizenship", label: "Путь к гражданству" },
        { id: "residency-was-now", label: "Было / стало" },
        { id: "residency-mistakes", label: "Ошибки" },
        { id: "residency-faq", label: "Вопросы" },
      ];
    case "vozmozhnosti":
      return [
        { id: "opportunities-highlights", label: "Основания" },
        { id: "opportunities-alternatives", label: "Альтернативы в регионе" },
        { id: "opportunities-support", label: "Самостоятельно и сопровождение" },
      ];
    case "poleznye-ssylki":
      return [
        { id: "official-links", label: "Официальные" },
        { id: "article-links", label: "Статьи" },
        { id: "related-links", label: "Смежные разделы" },
      ];
    default:
      return [];
  }
}
