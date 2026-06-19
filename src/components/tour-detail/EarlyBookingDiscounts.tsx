import { Tag } from "lucide-react";
import type { Tour } from "@/types/tour";
import { ORGANIZER_TOUR_DISCOUNT_OPTIONS } from "@/data/tour-discount-defaults";
import { resolveEnabledDiscountLabels } from "@/lib/tour-public-display";
import {
  tourDetailPromoHeadingClass,
  tourDetailPromoPanelClass,
} from "@/lib/tour-detail-ui";

interface EarlyBookingDiscountsProps {
  tour: Tour;
  compact?: boolean;
}

export default function EarlyBookingDiscounts({ tour, compact = false }: EarlyBookingDiscountsProps) {
  const labels = resolveEnabledDiscountLabels(tour);
  if (labels.length === 0) return null;

  const details = tour.pricing.enabledDiscounts
    .map((id) => ORGANIZER_TOUR_DISCOUNT_OPTIONS.find((option) => option.id === id))
    .filter(Boolean);

  if (compact) {
    return (
      <div className={tourDetailPromoPanelClass}>
        <p className={tourDetailPromoHeadingClass}>
          <Tag className="h-3.5 w-3.5" />
          Скидки за раннее бронирование
        </p>
        <ul className="mt-2 space-y-1">
          {labels.map((label) => (
            <li key={label} className="text-sm text-charcoal">
              {label}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sky/20 bg-sky/[0.05] p-6">
      <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-charcoal">
        <Tag className="h-5 w-5 text-sky" />
        Скидки за раннее бронирование
      </h3>
      <ul className="mt-4 space-y-3">
        {details.map((option) =>
          option ? (
            <li key={option.id} className="text-sm text-charcoal">
              <p className="font-medium">{option.label}</p>
              <p className="mt-1 text-slate">{option.description}</p>
            </li>
          ) : null
        )}
      </ul>
    </div>
  );
}
