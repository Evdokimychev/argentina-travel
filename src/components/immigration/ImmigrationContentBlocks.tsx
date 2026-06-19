import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type {
  ImmigrationHubCard,
  ImmigrationHubChecklistItem,
  ImmigrationHubStep,
  ImmigrationHistoryEvent,
  ImmigrationResidencyGround,
  ImmigrationWasNowItem,
} from "@/types/immigration-hub";
import { cn } from "@/lib/cn";

export function ImmigrationTermTitle({ title, titleEs }: { title: string; titleEs?: string }) {
  if (!titleEs) {
    return <h3 className="font-heading font-bold text-charcoal">{title}</h3>;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-heading text-base font-bold leading-snug text-charcoal sm:text-lg">{title}</h3>
      <span className="inline-flex items-center rounded-lg border border-sky/30 bg-sky/10 px-2.5 py-1 text-xs font-semibold text-sky-dark">
        {titleEs}
      </span>
    </div>
  );
}

export function ImmigrationCardGrid({ cards }: { cards: ImmigrationHubCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.title + (card.titleEs ?? "")}
          className="flex flex-col rounded-2xl border border-gray-100 bg-surface-muted/40 p-4 transition-shadow hover:shadow-md"
        >
          <span className="text-2xl" aria-hidden>
            {card.emoji}
          </span>
          <div className="mt-2">
            <ImmigrationTermTitle title={card.title} titleEs={card.titleEs} />
          </div>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-slate">{card.body}</p>
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

export function ImmigrationStepList({ steps }: { steps: ImmigrationHubStep[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step) => (
        <li
          key={step.step}
          className="flex gap-4 rounded-2xl border border-gray-100 bg-surface-muted/30 p-4 sm:p-5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky/10 font-heading text-lg font-bold text-sky">
            {step.step}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <ImmigrationTermTitle title={step.title} titleEs={step.titleEs} />
              {step.duration ? (
                <span className="shrink-0 rounded-full bg-charcoal/5 px-2 py-0.5 text-xs text-slate">
                  {step.duration}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ImmigrationChecklistGrid({ items }: { items: ImmigrationHubChecklistItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.title + (item.titleEs ?? "")}
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
          <div className="mt-2">
            <ImmigrationTermTitle title={item.title} titleEs={item.titleEs} />
            {item.required ? (
              <span className="mt-1 inline-block text-xs font-normal text-sky">обязательно</span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate">{item.description}</p>
        </div>
      ))}
    </div>
  );
}

export function ImmigrationGroundsTable({ grounds }: { grounds: ImmigrationResidencyGround[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-surface-muted/80">
            <th className="px-4 py-3 font-semibold text-charcoal">№</th>
            <th className="px-4 py-3 font-semibold text-charcoal">Основание</th>
            <th className="px-4 py-3 font-semibold text-charcoal">Кратко</th>
            <th className="px-4 py-3 font-semibold text-charcoal">Типичный срок</th>
          </tr>
        </thead>
        <tbody>
          {grounds.map((ground) => (
            <tr key={ground.num} className="border-b border-gray-50 last:border-0">
              <td className="px-4 py-3 align-top font-medium text-charcoal">{ground.num}</td>
              <td className="px-4 py-3 align-top">
                <p className="font-semibold text-charcoal">{ground.titleRu}</p>
                <span className="mt-1.5 inline-flex items-center rounded-md border border-sky/30 bg-sky/10 px-2 py-0.5 text-[11px] font-semibold text-sky-dark">
                  {ground.titleEs}
                </span>
              </td>
              <td className="px-4 py-3 align-top text-slate">{ground.summary}</td>
              <td className="px-4 py-3 align-top text-slate">{ground.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ImmigrationLinkGrid({
  links,
}: {
  links: { title: string; href: string; description?: string }[];
}) {
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

export function ImmigrationWasNowGrid({ items }: { items: ImmigrationWasNowItem[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => (
        <article key={item.topic} className="rounded-2xl border border-gray-100 bg-surface-muted/30 p-4">
          <h3 className="font-heading font-bold text-charcoal">{item.topic}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate">Было</p>
              <p className="mt-1 text-sm leading-relaxed text-slate">{item.before}</p>
            </div>
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Стало</p>
              <p className="mt-1 text-sm leading-relaxed text-charcoal">{item.after}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function ImmigrationHistoryTimeline({ events }: { events: ImmigrationHistoryEvent[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-sky/20 pl-6">
      {events.map((event) => (
        <li key={event.period + event.title} className="relative">
          <span
            className="absolute -left-[1.6rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-sky"
            aria-hidden
          />
          <p className="text-xs font-semibold uppercase tracking-wide text-sky">{event.period}</p>
          <p className="mt-0.5 font-heading font-bold text-charcoal">{event.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate">{event.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function ImmigrationMistakesList({ mistakes }: { mistakes: string[] }) {
  return (
    <ul className="space-y-2">
      {mistakes.map((mistake) => (
        <li key={mistake} className="flex gap-2 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm leading-relaxed text-charcoal">
          <span className="shrink-0 text-amber-600" aria-hidden>
            ⚠
          </span>
          {mistake}
        </li>
      ))}
    </ul>
  );
}

export function ImmigrationFaqList({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-2xl border border-gray-100 bg-surface-muted/30 px-4 py-3 open:bg-white"
        >
          <summary className="cursor-pointer list-none font-medium text-charcoal marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-start justify-between gap-3">
              {item.question}
              <span className="shrink-0 text-sky group-open:rotate-45" aria-hidden>
                +
              </span>
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-slate">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
