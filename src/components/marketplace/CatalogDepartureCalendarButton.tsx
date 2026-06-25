"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import type { TourListing } from "@/types";
import { Button } from "@/components/ui/button";
import CatalogDepartureCalendarModal from "@/components/marketplace/CatalogDepartureCalendarModal";
import { buildMarketplaceDepartureIndex } from "@/lib/marketplace-departure-calendar";

interface CatalogDepartureCalendarButtonProps {
  tours: TourListing[];
  className?: string;
  variant?: "default" | "outline";
}

export default function CatalogDepartureCalendarButton({
  tours,
  className,
  variant = "outline",
}: CatalogDepartureCalendarButtonProps) {
  const [open, setOpen] = useState(false);
  const index = useMemo(() => buildMarketplaceDepartureIndex(tours), [tours]);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
      >
        <CalendarDays className="h-4 w-4" aria-hidden />
        Календарь отправлений
        {index.totalDepartures > 0 ? (
          <span className="rounded-full bg-sky/10 px-1.5 py-0.5 text-[11px] font-semibold text-sky">
            {index.totalDepartures}
          </span>
        ) : null}
      </Button>

      <CatalogDepartureCalendarModal tours={tours} open={open} onOpenChange={setOpen} />
    </>
  );
}
