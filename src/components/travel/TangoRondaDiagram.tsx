import {
  TANGO_RONDA_DIAGRAM_UI,
  TANGO_RONDA_LEGEND,
} from "@/data/tango-ronda-diagram";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
};

/**
 * Ronda movement diagram — a semantic inline SVG (no raster, no baked-in text).
 * Server component: the accessible <title>/<desc>, all labels and the legend are
 * plain HTML/SVG text, so meaning survives with JS disabled and in dark mode.
 * Movement is conveyed by arrowheads + labels, never by colour alone.
 */
export default function TangoRondaDiagram({ className }: Props) {
  return (
    <section className={cn("space-y-3", className)} aria-label={TANGO_RONDA_DIAGRAM_UI.ariaLabel}>
      <div>
        <h3 className="font-heading text-base font-semibold text-charcoal">
          {TANGO_RONDA_DIAGRAM_UI.title}
        </h3>
        <p className="mt-1 text-sm text-slate">{TANGO_RONDA_DIAGRAM_UI.hint}</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-surface-muted/20 p-4">
        <svg
          viewBox="0 0 400 260"
          role="img"
          aria-labelledby="ronda-title ronda-desc"
          className="mx-auto block h-auto w-full max-w-md"
        >
          <title id="ronda-title">{TANGO_RONDA_DIAGRAM_UI.svgTitle}</title>
          <desc id="ronda-desc">{TANGO_RONDA_DIAGRAM_UI.svgDescription}</desc>

          {/* Floor outline */}
          <rect
            x="12"
            y="12"
            width="376"
            height="236"
            rx="20"
            className="fill-white stroke-gray-200 dark:fill-transparent"
            strokeWidth="2"
          />

          {/* Outer lane */}
          <rect
            x="34"
            y="34"
            width="332"
            height="192"
            rx="14"
            fill="none"
            className="text-emerald-600 dark:text-emerald-400"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="2 6"
            opacity="0.7"
          />
          {/* Inner lane */}
          <rect
            x="70"
            y="66"
            width="260"
            height="128"
            rx="12"
            fill="none"
            className="text-emerald-600 dark:text-emerald-400"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="2 6"
            opacity="0.5"
          />

          {/* Center — do not cross */}
          <g className="text-rose-600 dark:text-rose-400">
            <rect
              x="150"
              y="104"
              width="100"
              height="52"
              rx="10"
              fill="currentColor"
              opacity="0.08"
            />
            <rect
              x="150"
              y="104"
              width="100"
              height="52"
              rx="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.8"
            />
            <line x1="162" y1="116" x2="238" y2="144" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
            <line x1="238" y1="116" x2="162" y2="144" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
          </g>

          {/* Counter-clockwise flow arrows (top←, left↓, bottom→, right↑) */}
          <g className="text-sky" fill="currentColor" aria-hidden="true">
            {/* top edge → moving left */}
            <polygon points="210,44 226,38 226,50" />
            <polygon points="150,44 166,38 166,50" />
            {/* bottom edge → moving right */}
            <polygon points="190,216 174,210 174,222" />
            <polygon points="250,216 234,210 234,222" />
            {/* left edge → moving down */}
            <polygon points="44,150 38,134 50,134" />
            {/* right edge → moving up */}
            <polygon points="356,110 350,126 362,126" />
          </g>

          {/* Safe entry point */}
          <g className="text-amber-600 dark:text-amber-400">
            <circle cx="70" cy="226" r="9" fill="currentColor" opacity="0.15" />
            <circle cx="70" cy="226" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M66 226l3 3 5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {TANGO_RONDA_LEGEND.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5 text-sm">
            <span
              className={cn(
                "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-current",
                item.swatchClass,
              )}
              aria-hidden
            />
            <span className="text-slate">
              <span className="font-medium text-charcoal">{item.label}</span> — {item.description}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
