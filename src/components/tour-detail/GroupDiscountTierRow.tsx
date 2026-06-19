import { cn } from "@/lib/cn";
import {
  formatGroupDiscountTierGuestRange,
  formatGroupDiscountTierValueLabel,
} from "@/lib/group-discount";
import type { GroupDiscountTier } from "@/types/group-discount";

interface GroupDiscountTierRowProps {
  tier: GroupDiscountTier;
  basePriceUsd?: number;
  className?: string;
  badgeClassName?: string;
  emphasized?: boolean;
}

export default function GroupDiscountTierRow({
  tier,
  basePriceUsd,
  className,
  badgeClassName,
  emphasized = false,
}: GroupDiscountTierRowProps) {
  const range = formatGroupDiscountTierGuestRange(tier);
  const valueLabel = formatGroupDiscountTierValueLabel(tier, basePriceUsd);
  const isPercent = tier.discountType === "percent";

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <span className={cn("min-w-0 text-charcoal", emphasized ? "font-medium" : undefined)}>
        {range}
      </span>
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums leading-none",
          isPercent ? "bg-brand/10 text-brand" : "bg-sky/10 text-sky-dark",
          badgeClassName
        )}
      >
        {isPercent ? `−${Math.round(tier.value)}%` : valueLabel}
      </span>
    </div>
  );
}
