"use client";

import {
  getPageBuilderPatternPreviewChips,
  PAGE_BUILDER_PATTERN_CATEGORIES,
  type PageBuilderPatternDefinition,
} from "@/lib/cms/page-builder/pattern-registry";

type Props = {
  pattern: PageBuilderPatternDefinition;
  onSelect: () => void;
  /** Larger card for empty-state Design Library. */
  size?: "default" | "large";
};

export default function DesignLibraryPatternCard({
  pattern,
  onSelect,
  size = "default",
}: Props) {
  const Icon = pattern.icon;
  const chips = getPageBuilderPatternPreviewChips(pattern);
  const categoryLabel = PAGE_BUILDER_PATTERN_CATEGORIES[pattern.category].label;
  const isLarge = size === "large";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        isLarge
          ? "group flex h-full w-full flex-col rounded-2xl border border-sky/20 bg-white px-4 py-4 text-left shadow-sm transition hover:border-sky/40 hover:bg-sky/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/35"
          : "group flex h-full w-full flex-col rounded-card border border-sky/20 bg-sky/[0.045] px-3 py-3 text-left transition hover:border-sky/40 hover:bg-sky/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/35"
      }
    >
      <span className="flex items-start gap-3">
        <span
          className={
            isLarge
              ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-ink text-white"
              : "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-ink text-white"
          }
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-1 inline-block text-[10px] font-bold uppercase tracking-[0.12em] text-sky-ink/80">
            {categoryLabel}
          </span>
          <span className="block text-sm font-semibold text-foreground">{pattern.label}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
            {pattern.description}
          </span>
        </span>
      </span>
      {chips.length ? (
        <span
          className="mt-3 flex flex-wrap gap-1.5"
          aria-label={`Состав: ${chips.join(", ")}`}
        >
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-md border border-border-subtle/80 bg-surface-elevated/80 px-1.5 py-0.5 text-[10px] font-medium text-muted"
            >
              {chip}
            </span>
          ))}
        </span>
      ) : null}
      <span
        className={
          isLarge
            ? "mt-3 block text-xs font-semibold text-sky-ink"
            : "mt-2 block text-[11px] font-semibold text-sky-ink/90"
        }
      >
        Добавить секцию
      </span>
    </button>
  );
}
