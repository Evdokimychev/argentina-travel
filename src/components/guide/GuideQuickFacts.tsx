import {
  formatArsRate,
  getArgentinaExchangeRates,
} from "@/lib/argentina-exchange-rates";
import { getGuideQuickFactEmoji } from "@/data/guide-pillar-quick-fact-emojis";
import { cn } from "@/lib/cn";
import type { GuideQuickFact } from "@/types/guide-pillar";

type GuideQuickFactsProps = {
  facts: GuideQuickFact[];
  slug: string;
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

function QuickFactCard({
  emoji,
  label,
  value,
  live,
}: {
  emoji: string;
  label: string;
  value: string;
  live?: GuideQuickFact["live"];
}) {
  return (
    <div className="rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/5 to-white p-4">
      <span className="text-2xl" aria-hidden>
        {emoji}
      </span>
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate">{label}</p>
      <p className="mt-1 font-display text-base font-bold text-charcoal">{value}</p>
      {live ? (
        <p className="mt-0.5 text-[10px] text-slate">обновляется автоматически</p>
      ) : null}
    </div>
  );
}

export default async function GuideQuickFacts({ facts, slug, className }: GuideQuickFactsProps) {
  const resolved = await Promise.all(
    facts.map(async (fact) => ({
      ...fact,
      displayValue: fact.live ? (await resolveLiveValue(fact.live)) ?? fact.value : fact.value,
      emoji: getGuideQuickFactEmoji(slug, fact.label, fact.emoji),
    }))
  );

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {resolved.map((fact) => (
        <QuickFactCard
          key={fact.label}
          emoji={fact.emoji}
          label={fact.label}
          value={fact.displayValue}
          live={fact.live}
        />
      ))}
    </div>
  );
}

export function GuideQuickFactsStatic({ facts, slug, className }: GuideQuickFactsProps) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {facts.map((fact) => (
        <QuickFactCard
          key={fact.label}
          emoji={getGuideQuickFactEmoji(slug, fact.label, fact.emoji)}
          label={fact.label}
          value={fact.value}
          live={fact.live}
        />
      ))}
    </div>
  );
}
