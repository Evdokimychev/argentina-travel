import { cn } from "@/lib/cn";
import type { BlogEditorialDensity, BlogProsConsSide } from "@/types/blog-content-blocks";

type Props = {
  title?: string;
  pros: BlogProsConsSide;
  cons: BlogProsConsSide;
  recommendation?: string;
  density?: BlogEditorialDensity;
};

export default function ProsCons({
  title,
  pros,
  cons,
  recommendation,
  density = "comfortable",
}: Props) {
  if (pros.items.length === 0 && cons.items.length === 0) return null;

  return (
    <section
      className={cn(
        "not-prose space-y-3",
        density === "compact" ? "gap-2" : "gap-3",
      )}
      data-editorial-block="pros-cons"
      aria-label={title ?? "Плюсы и минусы"}
    >
      {title ? (
        <h3 className="font-heading text-base font-semibold text-charcoal">{title}</h3>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <SideCard
          title={pros.title ?? "Плюсы"}
          items={pros.items}
          tone="positive"
          density={density}
        />
        <SideCard
          title={cons.title ?? "Минусы"}
          items={cons.items}
          tone="negative"
          density={density}
        />
      </div>
      {recommendation ? (
        <p className="rounded-xl border border-sky/20 bg-sky/[0.04] px-4 py-3 text-sm leading-relaxed text-slate dark:border-sky/30 dark:bg-sky/[0.08] dark:text-muted">
          <span className="font-medium text-charcoal">Рекомендация: </span>
          {recommendation}
        </p>
      ) : null}
    </section>
  );
}

function SideCard({
  title,
  items,
  tone,
  density,
}: {
  title: string;
  items: string[];
  tone: "positive" | "negative";
  density: BlogEditorialDensity;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white dark:bg-surface-elevated",
        tone === "positive"
          ? "border-emerald-100 dark:border-emerald-900/40"
          : "border-amber-100 dark:border-amber-900/40",
        density === "compact" ? "p-3" : "p-4",
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          tone === "positive"
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-amber-700 dark:text-amber-300",
        )}
      >
        {title}
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.slice(0, 48)} className="flex gap-2 text-sm leading-relaxed text-slate dark:text-muted">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
