"use client";

import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function LevelScale({
  count,
  max = 5,
  className,
  activeClassName = "bg-brand",
}: {
  count: number;
  max?: number;
  className?: string;
  activeClassName?: string;
}) {
  return (
    <div className={cn("flex gap-0.5", className)}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i < count ? activeClassName : "bg-gray-200"
          )}
        />
      ))}
    </div>
  );
}

/** Emerald dot scale used on tour pages and comfort filters */
export function ComfortDotRating({
  filled,
  total = 5,
  className,
}: {
  filled: number;
  total?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 rounded-full",
            i < filled ? "bg-emerald-500" : "bg-gray-200"
          )}
        />
      ))}
    </span>
  );
}

/** Emerald bar scale for comfort levels on tour pages and editor */
export function ComfortBarRating({
  filled,
  total = 5,
  className,
}: {
  filled: number;
  total?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full gap-1", className)} aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full",
            i < filled ? "bg-emerald-500" : "bg-gray-200"
          )}
        />
      ))}
    </div>
  );
}

/** Brand/red dot scale for difficulty filters and tour cards */
export function DifficultyDotRating({
  filled,
  total = 5,
  className,
}: {
  filled: number;
  total?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 rounded-full",
            i < filled
              ? i >= 4
                ? "bg-red-500"
                : "bg-brand"
              : "bg-gray-200"
          )}
        />
      ))}
    </span>
  );
}

export function DurationScale({
  level,
  className,
}: {
  level: number;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-0.5", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full",
            i < level ? "bg-sky" : "bg-gray-200"
          )}
        />
      ))}
    </div>
  );
}

export function SidebarSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-gray-100 py-4 last:border-b-0">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-charcoal">
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100">
            <Icon className="h-3.5 w-3.5 text-slate" aria-hidden />
          </span>
        )}
        {title}
      </h3>
      {children}
    </section>
  );
}

export function SidebarOption({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
  scale,
  durationScale,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  title: string;
  description?: string;
  scale?: number;
  durationScale?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-all",
        selected
          ? "bg-brand-light/60 ring-1 ring-brand/15"
          : "hover:bg-gray-50"
      )}
    >
      {Icon ? (
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
            selected ? "bg-white text-brand" : "bg-gray-100 text-charcoal"
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
      ) : (
        <span
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
            selected
              ? "border-brand bg-brand text-white"
              : "border-gray-300 bg-white"
          )}
        >
          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium leading-snug text-charcoal">{title}</span>
          {Icon && selected && (
            <Check className="h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} aria-hidden />
          )}
        </span>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-slate">{description}</p>
        )}
        {scale != null && <LevelScale count={scale} className="mt-1.5" />}
        {durationScale != null && (
          <DurationScale level={durationScale} className="mt-1.5" />
        )}
      </span>
    </button>
  );
}
