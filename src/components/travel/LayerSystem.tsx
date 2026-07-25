import { LAYER_SYSTEM_ITEMS, LAYER_SYSTEM_UI } from "@/data/patagonia-packing-list";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  labels?: typeof LAYER_SYSTEM_UI;
};

/** Три слоя одежды: базовый, средний, внешний. Колонки на десктопе, стек на мобиле. */
export default function LayerSystem({ className, labels = LAYER_SYSTEM_UI }: Props) {
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

      <ol className="mt-4 grid gap-3 md:grid-cols-3" role="list">
        {LAYER_SYSTEM_ITEMS.map((layer, index) => (
          <li
            key={layer.id}
            className="flex flex-col rounded-2xl border border-gray-100 bg-surface-muted/40 p-4"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky text-sm font-semibold text-white">
              {index + 1}
            </span>
            <h4 className="mt-2 font-heading text-sm font-bold text-charcoal">{layer.title}</h4>
            <p className="mt-1 text-sm leading-relaxed text-slate">{layer.summary}</p>
            <ul className="mt-3 space-y-1.5" role="list">
              {layer.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-sm leading-snug text-charcoal">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky" aria-hidden />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
