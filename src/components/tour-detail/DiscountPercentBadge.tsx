"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface DiscountPercentBadgeProps {
  percent: number;
  className?: string;
}

export default function DiscountPercentBadge({ percent, className }: DiscountPercentBadgeProps) {
  const isFirstRender = useRef(true);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPulseKey((key) => key + 1);
  }, [percent]);

  return (
    <span
      key={pulseKey}
      className={cn(
        "pointer-events-none absolute right-0 top-0 rounded-bl-2xl rounded-tr-[1.35rem] bg-brand px-3.5 py-2 text-sm font-bold leading-none tracking-tight text-white shadow-md sm:px-4 sm:py-2.5 sm:text-base",
        pulseKey > 0 && "animate-discount-badge-pulse",
        className
      )}
      aria-label={`Скидка ${percent} процентов`}
      aria-live="polite"
    >
      −{percent}%
    </span>
  );
}
