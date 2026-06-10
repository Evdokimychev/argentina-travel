import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Scale,
  Users,
} from "lucide-react";
import HubDataTable from "@/components/guide/hub/HubDataTable";
import HubSection from "@/components/guide/hub/HubSection";
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
  ImmigrationLinkGrid,
  ImmigrationStepList,
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
            <ol className="space-y-3">
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
          </HubSection>

          <HubSection id="documents" title="Документы для residencia">
            <p className="text-sm text-slate">{process.documentsIntro}</p>
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

    case "grazhdanstvo":
      return (
        <>
          <HubSection id="citizenship-cards" title="Что даёт гражданство">
            <ImmigrationCardGrid cards={IMMIGRATION_CITIZENSHIP.cards} />
          </HubSection>
          <HubSection id="citizenship-path" title="Путь к паспорту">
            <ImmigrationStepList steps={IMMIGRATION_CITIZENSHIP.pathSteps} />
            <aside className="mt-5 rounded-2xl border border-gray-100 bg-surface-muted/40 p-4 text-sm text-slate">
              {IMMIGRATION_CITIZENSHIP.note}
            </aside>
          </HubSection>
        </>
      );

    case "vnzh-i-pmzh":
      return (
        <>
          <HubSection id="residency-types" title="Типы статуса">
            <div className="grid gap-4 sm:grid-cols-2">
              {IMMIGRATION_RESIDENCY.types.map((type) => (
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
          <HubSection id="residency-grounds" title="14 оснований для residencia temporaria">
            <HubDataTable table={IMMIGRATION_RESIDENCY.groundsTable} />
            <Link
              href={IMMIGRATION_RESIDENCY.overviewHref}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
            >
              {IMMIGRATION_RESIDENCY.overviewLabel}
            </Link>
          </HubSection>
        </>
      );

    case "vozmozhnosti": {
      const opp = IMMIGRATION_OPPORTUNITIES;
      return (
        <>
          <HubSection id="opportunities-highlights" title="Основания под ваш профиль">
            <ImmigrationCardGrid cards={opp.highlights} />
          </HubSection>
          <HubSection id="opportunities-alternatives" title="Альтернативы в LatAm">
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
                  <p className="mt-2 font-display font-bold text-charcoal">{alt.title}</p>
                  <p className="mt-1 text-sm text-slate">{alt.body}</p>
                </div>
              ))}
            </div>
          </HubSection>
          <HubSection id="opportunities-support" title="DIY или сопровождение">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-surface-muted/40 p-5">
                <Users className="h-8 w-8 text-sky" aria-hidden />
                <h3 className="mt-3 font-display text-lg font-bold text-charcoal">{opp.diyTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{opp.diyBody}</p>
              </div>
              <div className="rounded-2xl border border-sky/25 bg-gradient-to-br from-sky/5 to-white p-5">
                <Scale className="h-8 w-8 text-sky" aria-hidden />
                <h3 className="mt-3 font-display text-lg font-bold text-charcoal">{opp.proTitle}</h3>
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
        { id: "dnu", label: "DNU 366/2025" },
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
        { id: "citizenship-path", label: "Путь к паспорту" },
      ];
    case "vnzh-i-pmzh":
      return [
        { id: "residency-types", label: "Типы статуса" },
        { id: "residency-grounds", label: "14 оснований" },
      ];
    case "vozmozhnosti":
      return [
        { id: "opportunities-highlights", label: "Основания" },
        { id: "opportunities-alternatives", label: "Альтернативы LatAm" },
        { id: "opportunities-support", label: "DIY и сопровождение" },
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
