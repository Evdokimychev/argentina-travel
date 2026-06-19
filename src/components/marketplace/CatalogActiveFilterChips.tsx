"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export type CatalogFilterChip = {
  id: string;
  label: string;
  onRemove: () => void;
};

type CatalogActiveFilterChipsProps = {
  chips: CatalogFilterChip[];
  onClearAll?: () => void;
  clearAllLabel?: string;
  className?: string;
};

export default function CatalogActiveFilterChips({
  chips,
  onClearAll,
  clearAllLabel = "Сбросить все",
  className,
}: CatalogActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-sky/20 bg-sky/5 py-1 pl-3 pr-2 text-xs font-medium text-charcoal transition-colors hover:border-sky/35 hover:bg-sky/10"
          aria-label={`Убрать фильтр: ${chip.label}`}
        >
          <span className="truncate">{chip.label}</span>
          <X className="h-3.5 w-3.5 shrink-0 text-slate" aria-hidden />
        </button>
      ))}
      {onClearAll && chips.length > 1 ? (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-slate underline-offset-2 transition-colors hover:text-charcoal hover:underline"
        >
          {clearAllLabel}
        </button>
      ) : null}
    </div>
  );
}
