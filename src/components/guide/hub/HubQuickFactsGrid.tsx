import { normalizeQuickFact } from "@/lib/normalize-quick-fact";
import { cn } from "@/lib/cn";

export type HubQuickFactItem = {
  emoji?: string;
  label: string;
  headline?: string;
  detail?: string;
  value?: string;
  live?: "exchange-oficial" | "exchange-blue";
};

type HubQuickFactsGridProps = {
  facts: HubQuickFactItem[];
  className?: string;
  /** Default 3; immigration hub uses 4 columns for 8 cards */
  columns?: 3 | 4;
};

function QuickFactCard({
  emoji,
  label,
  headline,
  detail,
  live,
}: {
  emoji?: string;
  label: string;
  headline: string;
  detail?: string;
  live?: HubQuickFactItem["live"];
}) {
  return (
    <article className="rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/[0.06] to-white p-4 sm:p-[18px]">
      {emoji ? (
        <span className="text-xl leading-none sm:text-2xl" aria-hidden>
          {emoji}
        </span>
      ) : null}
      <p className={cn("text-[11px] font-medium uppercase tracking-wider text-slate/90", emoji && "mt-2.5")}>
        {label}
      </p>
      <p className="mt-1.5 text-[15px] font-semibold leading-snug tracking-tight text-charcoal">{headline}</p>
      {detail ? (
        <p className="mt-1.5 text-xs leading-relaxed text-slate">{detail}</p>
      ) : null}
      {live ? (
        <p className="mt-2 text-[10px] font-medium text-sky/80">обновляется автоматически</p>
      ) : null}
    </article>
  );
}

export default function HubQuickFactsGrid({ facts, className, columns = 3 }: HubQuickFactsGridProps) {
  const gridClass =
    columns === 4
      ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3";

  return (
    <div className={cn(gridClass, className)}>
      {facts.map((fact) => {
        const { headline, detail } = normalizeQuickFact(fact);
        return (
          <QuickFactCard
            key={fact.label}
            emoji={fact.emoji}
            label={fact.label}
            headline={headline}
            detail={detail}
            live={fact.live}
          />
        );
      })}
    </div>
  );
}
