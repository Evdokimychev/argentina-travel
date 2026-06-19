"use client";

import { createContext, useContext, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const FilterPopoverCloseContext = createContext<(() => void) | null>(null);

export function useFilterPopoverClose() {
  return useContext(FilterPopoverCloseContext);
}

interface FilterPopoverProps {
  label: string;
  active?: boolean;
  children: React.ReactNode;
  width?: string;
}

export function FilterPopover({
  label,
  active,
  children,
  width = "min-w-[340px]",
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <FilterPopoverCloseContext.Provider value={close}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-brand bg-brand-light text-brand"
                : "border-gray-200 bg-white text-charcoal hover:border-gray-300"
            )}
          >
            {label}
            <ChevronDown className="h-4 w-4 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className={cn("max-w-[calc(100vw-2rem)] p-0", width)}
          align="start"
          collisionPadding={16}
        >
          {children}
        </PopoverContent>
      </Popover>
    </FilterPopoverCloseContext.Provider>
  );
}

export function FilterFooter({
  onClear,
  onApply,
  applyAfterClear = true,
}: {
  onClear: () => void;
  onApply: () => void;
  applyAfterClear?: boolean;
}) {
  const close = useFilterPopoverClose();

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    onClear();
    if (applyAfterClear) {
      onApply();
    }
    close?.();
  };

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    onApply();
    close?.();
  };

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-b-2xl border-t border-gray-100">
      <Button
        variant="secondary"
        type="button"
        className="h-12 rounded-none"
        onClick={handleClear}
      >
        Очистить
      </Button>
      <Button type="button" className="h-12 rounded-none" onClick={handleApply}>
        Применить
      </Button>
    </div>
  );
}

export function CheckboxList({
  items,
  selected,
  onToggle,
  withDescription = false,
  counts,
}: {
  items: readonly string[] | readonly { level: string; description: string }[];
  selected: string[];
  onToggle: (item: string) => void;
  withDescription?: boolean;
  counts?: Partial<Record<string, number>>;
}) {
  return (
    <ul className="max-h-72 overflow-y-auto p-2">
      {withDescription
        ? (items as readonly { level: string; description: string }[]).map((item) => {
            const count = counts?.[item.level];
            const disabled = counts != null && (count ?? 0) === 0;
            return (
              <li key={item.level}>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-gray-50",
                    selected.includes(item.level) && "bg-brand-light/40",
                    disabled && "cursor-not-allowed opacity-45"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(item.level)}
                    disabled={disabled}
                    onChange={() => onToggle(item.level)}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-gray-300 accent-brand"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-charcoal">{item.level}</p>
                      {count != null && count > 0 && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] tabular-nums text-slate">
                          {count}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate">{item.description}</p>
                  </div>
                </label>
              </li>
            );
          })
        : (items as readonly string[]).map((label) => {
            const count = counts?.[label];
            const disabled = counts != null && (count ?? 0) === 0;
            return (
              <li key={label}>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-gray-50",
                    selected.includes(label) && "bg-brand-light/40",
                    disabled && "cursor-not-allowed opacity-45"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(label)}
                    disabled={disabled}
                    onChange={() => onToggle(label)}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-gray-300 accent-brand"
                  />
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <p className="text-sm font-medium text-charcoal">{label}</p>
                    {count != null && count > 0 && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] tabular-nums text-slate">
                        {count}
                      </span>
                    )}
                  </div>
                </label>
              </li>
            );
          })}
    </ul>
  );
}
