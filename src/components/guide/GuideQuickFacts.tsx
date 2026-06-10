import {
  formatArsRate,
  getArgentinaExchangeRates,
} from "@/lib/argentina-exchange-rates";
import { cn } from "@/lib/cn";
import type { GuideQuickFact } from "@/types/guide-pillar";

type GuideQuickFactsProps = {
  facts: GuideQuickFact[];
  className?: string;
};

async function resolveLiveValue(live: GuideQuickFact["live"]): Promise<string | null> {
  if (!live) return null;
  try {
    const result = await getArgentinaExchangeRates();
    if (!result.ok) return null;
    const quote = live === "exchange-oficial" ? result.data.oficial : result.data.blue;
    return `${formatArsRate(quote.sell)} ARS`;
  } catch {
    return null;
  }
}

export default async function GuideQuickFacts({ facts, className }: GuideQuickFactsProps) {
  const resolved = await Promise.all(
    facts.map(async (fact) => ({
      ...fact,
      displayValue: fact.live ? (await resolveLiveValue(fact.live)) ?? fact.value : fact.value,
    }))
  );

  return (
    <section className={cn("mt-8", className)} aria-labelledby="quick-facts-title">
      <h2 id="quick-facts-title" className="font-display text-lg font-bold text-charcoal">
        Быстрые факты
      </h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {resolved.map((fact) => (
          <div
            key={fact.label}
            className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-card"
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-slate">{fact.label}</dt>
            <dd className="mt-1 font-display text-sm font-bold text-charcoal">{fact.displayValue}</dd>
            {fact.live ? (
              <p className="mt-0.5 text-[10px] text-slate">обновляется автоматически</p>
            ) : null}
          </div>
        ))}
      </dl>
    </section>
  );
}

export function GuideQuickFactsStatic({ facts, className }: GuideQuickFactsProps) {
  return (
    <section className={cn("mt-8", className)} aria-labelledby="quick-facts-title">
      <h2 id="quick-facts-title" className="font-display text-lg font-bold text-charcoal">
        Быстрые факты
      </h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-card"
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-slate">{fact.label}</dt>
            <dd className="mt-1 font-display text-sm font-bold text-charcoal">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
