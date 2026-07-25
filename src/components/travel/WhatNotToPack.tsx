import { WHAT_NOT_TO_PACK, WHAT_NOT_TO_PACK_UI } from "@/data/patagonia-packing-list";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  labels?: typeof WHAT_NOT_TO_PACK_UI;
};

/** Компактный «отрицательный» список: что лучше не брать в Патагонию. */
export default function WhatNotToPack({ className, labels = WHAT_NOT_TO_PACK_UI }: Props) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
      aria-label={labels.ariaLabel}
    >
      <h3 className="font-heading text-base font-semibold text-charcoal">{labels.title}</h3>
      <p className="mt-1 text-sm text-slate">{labels.hint}</p>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2" role="list">
        {WHAT_NOT_TO_PACK.map((item) => (
          <li
            key={item.id}
            className="flex gap-2.5 rounded-xl border border-gray-100 bg-surface-muted/40 px-3 py-2.5"
          >
            <span
              className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-error-muted text-sm font-bold text-error"
              aria-hidden
            >
              ×
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium leading-snug text-charcoal">
                {item.label}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate">{item.reason}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
