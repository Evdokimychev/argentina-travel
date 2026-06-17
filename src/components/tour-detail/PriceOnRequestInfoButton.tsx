"use client";

import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  TOUR_PRICE_ON_REQUEST_HINT,
  TOUR_PRICE_ON_REQUEST_REFERENCE_HINT,
} from "@/lib/tour-price-public";
import { cn } from "@/lib/cn";

interface PriceOnRequestInfoButtonProps {
  hasReferencePrice?: boolean;
  className?: string;
}

export default function PriceOnRequestInfoButton({
  hasReferencePrice = false,
  className,
}: PriceOnRequestInfoButtonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full text-slate/70 transition-colors hover:bg-gray-100 hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40",
            className
          )}
          aria-label="Подробнее о стоимости"
        >
          <HelpCircle className="h-3.5 w-3.5" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="min-w-[240px] max-w-[min(300px,calc(100vw-2rem))] p-3 text-sm leading-relaxed text-charcoal"
        side="top"
        align="start"
      >
        {hasReferencePrice ? TOUR_PRICE_ON_REQUEST_REFERENCE_HINT : TOUR_PRICE_ON_REQUEST_HINT}
      </PopoverContent>
    </Popover>
  );
}
