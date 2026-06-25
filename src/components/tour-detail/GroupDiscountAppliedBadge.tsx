"use client";

import FormattedPrice from "@/components/FormattedPrice";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/cn";

interface GroupDiscountAppliedBadgeProps {
  totalBeforeGroupDiscountUsd: number;
  totalPriceUsd: number;
  className?: string;
}

export default function GroupDiscountAppliedBadge({
  totalBeforeGroupDiscountUsd,
  totalPriceUsd,
  className,
}: GroupDiscountAppliedBadgeProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex cursor-pointer items-center rounded-full border border-sky/20 bg-sky/10 px-2.5 py-0.5 text-[11px] font-medium leading-snug text-sky-dark",
            "decoration-sky/35 underline decoration-dotted underline-offset-[3px]",
            "transition-colors hover:border-sky/35 hover:bg-sky/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40",
            className
          )}
          aria-label="Групповая скидка применена. Нажмите для подробностей о пересчёте цены"
        >
          Групповая скидка применена
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-3 text-sm leading-relaxed text-charcoal sm:min-w-[240px] sm:max-w-[300px]"
        side="top"
        align="start"
        sideOffset={6}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <p className="text-xs font-semibold text-charcoal">Групповая скидка</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate">
          Без групповой скидки заявка стоила бы{" "}
          <FormattedPrice
            priceUsd={totalBeforeGroupDiscountUsd}
            className="font-medium text-charcoal"
          />
          . Для вашей группы —{" "}
          <FormattedPrice priceUsd={totalPriceUsd} className="font-semibold text-charcoal" />.
        </p>
      </PopoverContent>
    </Popover>
  );
}
