import HubQuickFactsGrid from "@/components/guide/hub/HubQuickFactsGrid";
import { getGuideQuickFactEmoji } from "@/data/guide-pillar-quick-fact-emojis";
import {
  formatArsRate,
  getArgentinaExchangeRates,
} from "@/lib/argentina-exchange-rates";
import type { GuideQuickFact } from "@/types/guide-pillar";

type GuideQuickFactsProps = {
  facts: GuideQuickFact[];
  slug: string;
  className?: string;
  columns?: 3 | 4;
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

function withEmojis(facts: GuideQuickFact[], slug: string) {
  return facts.map((fact) => ({
    ...fact,
    emoji: getGuideQuickFactEmoji(slug, fact.label, fact.emoji),
  }));
}

export default async function GuideQuickFacts({ facts, slug, className }: GuideQuickFactsProps) {
  const resolved = await Promise.all(
    facts.map(async (fact) => {
      const liveHeadline = fact.live ? (await resolveLiveValue(fact.live)) ?? fact.headline ?? fact.value : null;
      return {
        ...fact,
        headline: liveHeadline ?? fact.headline,
        emoji: getGuideQuickFactEmoji(slug, fact.label, fact.emoji),
      };
    })
  );

  return <HubQuickFactsGrid facts={resolved} className={className} />;
}

export function GuideQuickFactsStatic({ facts, slug, className, columns }: GuideQuickFactsProps) {
  return (
    <HubQuickFactsGrid facts={withEmojis(facts, slug)} className={className} columns={columns} />
  );
}
