"use client";

import { ArrowRight } from "lucide-react";
import { TRANSFER_POPULAR_ROUTES } from "@/data/transfer-popular-routes";
import { getTransferLocationById } from "@/data/transfer-locations";
import { cn } from "@/lib/utils";
import type { TransferLocation } from "@/lib/intui/types";

type TransferPopularRoutesProps = {
  title: string;
  onSelect: (origin: TransferLocation, destination: TransferLocation) => void;
  className?: string;
};

export default function TransferPopularRoutes({
  title,
  onSelect,
  className,
}: TransferPopularRoutesProps) {
  return (
    <section className={cn(className)}>
      <h2 className="font-heading text-lg font-bold text-charcoal">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {TRANSFER_POPULAR_ROUTES.map((route) => (
          <button
            key={route.id}
            type="button"
            onClick={() => {
              const origin = getTransferLocationById(route.originId);
              const destination = getTransferLocationById(route.destinationId);
              if (origin && destination) onSelect(origin, destination);
            }}
            className="group inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm text-charcoal shadow-card transition-all hover:border-sky/25 hover:bg-sky/[0.04] hover:shadow-elevated"
          >
            <span>
              {route.originLabel} → {route.destinationLabel}
            </span>
            <ArrowRight className="h-4 w-4 text-slate group-hover:text-sky" />
          </button>
        ))}
      </div>
    </section>
  );
}
