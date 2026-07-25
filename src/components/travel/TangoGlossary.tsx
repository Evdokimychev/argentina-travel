import {
  TANGO_GLOSSARY_TERMS,
  TANGO_GLOSSARY_UI,
} from "@/data/tango-glossary";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
};

/**
 * Tango glossary. Server component: every term and definition is in the
 * initial HTML with a stable anchor id, so it reads fully without JavaScript.
 */
export default function TangoGlossary({ className }: Props) {
  return (
    <section className={cn("space-y-3", className)} aria-label={TANGO_GLOSSARY_UI.ariaLabel}>
      <div>
        <h3 className="font-heading text-base font-semibold text-charcoal">
          {TANGO_GLOSSARY_UI.title}
        </h3>
        <p className="mt-1 text-sm text-slate">{TANGO_GLOSSARY_UI.hint}</p>
      </div>

      <dl className="grid gap-2.5 sm:grid-cols-2">
        {TANGO_GLOSSARY_TERMS.map((term) => (
          <div
            key={term.id}
            id={term.id}
            // Hairline border only — no nested shadowed card.
            className="scroll-mt-24 rounded-2xl border border-gray-100 bg-surface-muted/20 p-3.5"
          >
            <dt className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-heading text-sm font-bold text-charcoal" lang="es">
                {term.term}
              </span>
              <span className="text-xs text-slate">— {term.short}</span>
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-slate">{term.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
