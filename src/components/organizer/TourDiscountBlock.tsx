"use client";

import { ORGANIZER_TOUR_DISCOUNT_OPTIONS, type OrganizerTourDiscountType } from "@/data/tour-discount-defaults";
import { cn } from "@/lib/cn";

interface TourDiscountBlockProps {
  enabledDiscounts: OrganizerTourDiscountType[];
  onChange: (discounts: OrganizerTourDiscountType[]) => void;
}

export default function TourDiscountBlock({
  enabledDiscounts,
  onChange,
}: TourDiscountBlockProps) {
  function toggleDiscount(id: OrganizerTourDiscountType) {
    if (enabledDiscounts.includes(id)) {
      onChange(enabledDiscounts.filter((item) => item !== id));
      return;
    }
    onChange([...enabledDiscounts, id]);
  }

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">Скидка</h2>

      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
        Если скидки пересекаются (одновременно выполняются условия 2 или 3 скидок) — то к
        стоимости брони будет применена <span className="font-semibold">наибольшая из них</span>
      </div>

      <div className="space-y-4">
        {ORGANIZER_TOUR_DISCOUNT_OPTIONS.map(({ id, label, description, descriptionEmphasis }) => {
          const selected = enabledDiscounts.includes(id);

          return (
            <label
              key={id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
                selected
                  ? "border-sky/40 bg-sky/[0.08] ring-1 ring-sky/20"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleDiscount(id)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-brand"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-charcoal">{label}</span>
                <span className="mt-1 block text-sm leading-relaxed text-slate">
                  {description}
                  {descriptionEmphasis ? (
                    <>
                      {" "}
                      <span className="font-semibold text-charcoal">{descriptionEmphasis}</span>
                    </>
                  ) : null}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
