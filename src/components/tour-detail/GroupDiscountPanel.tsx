import { Users } from "lucide-react";
import type { GroupDiscountSettings } from "@/types/group-discount";
import {
  formatGroupDiscountTierGuestRange,
  formatGroupDiscountTierValueLabel,
  normalizeGroupDiscountSettings,
  resolveGroupDiscountQuote,
} from "@/lib/group-discount";
import {
  tourDetailPromoHeadingClass,
  tourDetailPromoPanelClass,
} from "@/lib/tour-detail-ui";
import GroupDiscountTierRow from "./GroupDiscountTierRow";

interface GroupDiscountPanelProps {
  settings?: GroupDiscountSettings | null;
  basePriceUsd: number;
  guestCount?: number;
  compact?: boolean;
}

export default function GroupDiscountPanel({
  settings,
  basePriceUsd,
  guestCount,
  compact = false,
}: GroupDiscountPanelProps) {
  const normalized = normalizeGroupDiscountSettings(settings);
  if (!normalized.enabled) return null;

  const activeQuote =
    guestCount != null && guestCount >= 2
      ? resolveGroupDiscountQuote(basePriceUsd, guestCount, normalized)
      : null;

  if (compact) {
    return (
      <div className={tourDetailPromoPanelClass}>
        <p className={tourDetailPromoHeadingClass}>
          <Users className="h-3.5 w-3.5" aria-hidden />
          Групповая скидка
        </p>
        <ul className="mt-2 space-y-1.5">
          {normalized.tiers.map((tier) => (
            <li key={tier.id}>
              <GroupDiscountTierRow tier={tier} basePriceUsd={basePriceUsd} className="text-sm" />
            </li>
          ))}
        </ul>
        {activeQuote?.appliedTier ? (
          <div className="mt-2 rounded-lg border border-sky/15 bg-white/70 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate">
              Для вашей группы
            </p>
            <GroupDiscountTierRow
              tier={activeQuote.appliedTier}
              basePriceUsd={basePriceUsd}
              className="mt-1 text-sm"
              emphasized
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sky/20 bg-sky/[0.05] p-6">
      <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-charcoal">
        <Users className="h-5 w-5 text-sky" aria-hidden />
        Групповая скидка
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate">
        Чем больше туристов в одной заявке — тем ниже цена за человека. Скидка применяется
        автоматически при бронировании.
      </p>
      <ul className="mt-4 space-y-2">
        {normalized.tiers.map((tier) => (
          <li
            key={tier.id}
            className="rounded-xl bg-white/80 px-4 py-2.5 text-sm"
          >
            <GroupDiscountTierRow tier={tier} basePriceUsd={basePriceUsd} />
          </li>
        ))}
      </ul>
      {activeQuote?.appliedTier ? (
        <div className="mt-4 rounded-xl border border-sky/15 bg-white/80 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate">
            Для выбранного количества туристов
          </p>
          <GroupDiscountTierRow
            tier={activeQuote.appliedTier}
            basePriceUsd={basePriceUsd}
            className="mt-2 text-sm"
            emphasized
          />
        </div>
      ) : null}
    </div>
  );
}
