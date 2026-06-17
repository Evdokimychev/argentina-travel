import { Users } from "lucide-react";
import type { GroupDiscountSettings } from "@/types/group-discount";
import {
  formatGroupDiscountTierLabel,
  normalizeGroupDiscountSettings,
  resolveGroupDiscountQuote,
} from "@/lib/group-discount";
import {
  tourDetailPromoHeadingClass,
  tourDetailPromoPanelClass,
} from "@/lib/tour-detail-ui";

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
        <ul className="mt-2 space-y-1">
          {normalized.tiers.map((tier) => (
            <li key={tier.id} className="text-sm text-charcoal">
              {formatGroupDiscountTierLabel(tier, basePriceUsd)}
            </li>
          ))}
        </ul>
        {activeQuote?.appliedTier ? (
          <p className="mt-2 text-xs font-medium text-sky-dark">
            Для вашей группы действует скидка:{" "}
            {formatGroupDiscountTierLabel(activeQuote.appliedTier, basePriceUsd)}
          </p>
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
            className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-4 py-2.5 text-sm"
          >
            <span className="text-charcoal">{formatGroupDiscountTierLabel(tier, basePriceUsd)}</span>
          </li>
        ))}
      </ul>
      {activeQuote?.appliedTier ? (
        <p className="mt-4 rounded-xl border border-sky/15 bg-white/80 px-4 py-3 text-sm font-medium text-charcoal">
          Для выбранного количества туристов:{" "}
          {formatGroupDiscountTierLabel(activeQuote.appliedTier, basePriceUsd)}
        </p>
      ) : null}
    </div>
  );
}
