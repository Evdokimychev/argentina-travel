"use client";

import { Check, X } from "lucide-react";
import TourSection from "@/components/tour-detail/TourSection";

export default function ExcursionIncludedSection({
  included,
  excluded,
  title,
  includedLabel,
  excludedLabel,
}: {
  included?: string;
  excluded?: string;
  title: string;
  includedLabel: string;
  excludedLabel: string;
}) {
  if (!included && !excluded) return null;

  return (
    <TourSection id="included" title={title}>
      <div className="grid gap-4 sm:grid-cols-2">
        {included ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <Check className="h-4 w-4" aria-hidden />
              {includedLabel}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-charcoal/90">{included}</p>
          </div>
        ) : null}
        {excluded ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-rose-800">
              <X className="h-4 w-4" aria-hidden />
              {excludedLabel}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-charcoal/90">{excluded}</p>
          </div>
        ) : null}
      </div>
    </TourSection>
  );
}
