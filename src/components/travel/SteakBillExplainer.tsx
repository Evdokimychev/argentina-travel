import {
  STEAK_BILL_EXPLAINER_UI,
  STEAK_BILL_LINE_ITEMS,
} from "@/data/steak-bill-explainer";

type Props = {
  className?: string;
};

/** Illustrative bill breakdown — relative shares only, never currency figures. */
export default function SteakBillExplainer({ className }: Props) {
  return (
    // Flat by design — a boxed card here would nest inside the section and
    // the article card. Progress bars + typography carry the structure.
    <section className={className} aria-label={STEAK_BILL_EXPLAINER_UI.ariaLabel}>
      <h3 className="font-heading text-base font-semibold text-charcoal">
        {STEAK_BILL_EXPLAINER_UI.title}
      </h3>
      <p className="mt-1 text-sm text-slate">{STEAK_BILL_EXPLAINER_UI.hint}</p>

      <ul className="mt-4 space-y-2.5">
        {STEAK_BILL_LINE_ITEMS.map((item) => (
          <li key={item.id}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-charcoal">
                {item.label}
                {item.optional ? (
                  <span className="ml-1.5 text-xs text-slate">(если применимо)</span>
                ) : null}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-sky/70"
                style={{ width: `${Math.round(item.share * 100)}%` }}
                aria-hidden
              />
            </div>
            {item.note ? (
              <p className="mt-1 text-xs leading-relaxed text-slate">{item.note}</p>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-slate">
        {STEAK_BILL_EXPLAINER_UI.disclaimer}
      </p>
    </section>
  );
}
