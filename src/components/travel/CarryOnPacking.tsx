import { CARRY_ON_ITEMS, CARRY_ON_UI } from "@/data/patagonia-packing-list";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  labels?: typeof CARRY_ON_UI;
};

/** HTML-схема ручной клади на 7–10 дней: контур сумки с перечнем вещей. */
export default function CarryOnPacking({ className, labels = CARRY_ON_UI }: Props) {
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

      {/* Схематичный контур сумки с «ручкой» сверху. */}
      <div className="mt-4">
        <div
          className="mx-auto h-2.5 w-16 rounded-t-xl border-2 border-b-0 border-gray-200"
          aria-hidden
        />
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-surface-muted/40 p-3 sm:p-4">
          <ul className="grid gap-2 sm:grid-cols-2" role="list">
            {CARRY_ON_ITEMS.map((item) => (
              <li
                key={item.id}
                className="flex gap-2.5 rounded-xl border border-gray-100 bg-white px-3 py-2.5"
              >
                <span
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sky/10 text-xs font-bold text-sky-ink"
                  aria-hidden
                >
                  ✓
                </span>
                <span className="min-w-0">
                  <span className="block text-sm leading-snug text-charcoal">{item.label}</span>
                  {item.hint ? (
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate">
                      {item.hint}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
