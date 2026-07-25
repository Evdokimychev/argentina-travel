import {
  STEAK_ORDER_SCENARIOS,
  STEAK_ORDER_SCENARIOS_UI,
} from "@/data/steak-order-scenarios";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
};

/** Native HTML scenario cards — replaces the old markdown "### scenario" body layout. */
export default function SteakOrderScenarios({ className }: Props) {
  return (
    <section
      className={cn("space-y-3", className)}
      aria-label={STEAK_ORDER_SCENARIOS_UI.ariaLabel}
    >
      <p className="text-sm text-slate">{STEAK_ORDER_SCENARIOS_UI.hint}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {STEAK_ORDER_SCENARIOS.map((scenario) => (
          <article
            key={scenario.id}
            // Hairline border only — this card is the primary interactive
            // surface of the widget, so no extra shadow layer on top.
            className="flex flex-col rounded-2xl border border-gray-100 bg-surface-muted/20 p-4"
          >
            <h4 className="font-heading text-sm font-semibold text-charcoal">
              {scenario.title}
            </h4>
            <ul className="mt-2.5 space-y-1.5">
              {scenario.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {scenario.phrase ? (
              <blockquote className="mt-3 rounded-xl bg-surface-muted/50 px-3 py-2 text-sm text-charcoal">
                <p lang="es" className="font-medium">
                  {scenario.phrase}
                </p>
                {scenario.phraseRu ? (
                  <p className="mt-1 text-xs text-slate">{scenario.phraseRu}</p>
                ) : null}
              </blockquote>
            ) : null}
            <p className="mt-3 text-xs leading-relaxed text-slate">{scenario.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
