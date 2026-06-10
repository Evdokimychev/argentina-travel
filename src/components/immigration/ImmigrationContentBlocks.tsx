import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ImmigrationHubCard, ImmigrationHubStep } from "@/types/immigration-hub";

export function ImmigrationCardGrid({ cards }: { cards: ImmigrationHubCard[] }) {
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

export function ImmigrationStepList({ steps }: { steps: ImmigrationHubStep[] }) {
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
