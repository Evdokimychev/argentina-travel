"use client";

import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface FilterPopoverProps {
  label: string;
  active?: boolean;
  children: React.ReactNode;
  width?: string;
}

export function FilterPopover({ label, active, children, width = "min-w-[340px]" }: FilterPopoverProps) {
  return (
    <Popover>
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
      <PopoverContent className={cn("p-0", width)} align="start">
        {children}
      </PopoverContent>
    </Popover>
  );
}

export function FilterFooter({
  onClear,
  onApply,
}: {
  onClear: () => void;
  onApply: () => void;
}) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-b-2xl border-t border-gray-100">
      <Button
        variant="secondary"
        type="button"
        className="rounded-none h-12"
        onClick={(e) => {
          e.preventDefault();
          onClear();
        }}
      >
        Очистить
      </Button>
      <Button
        type="button"
        className="rounded-none h-12"
        onClick={(e) => {
          e.preventDefault();
          onApply();
        }}
      >
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
}: {
  items: readonly string[] | readonly { level: string; description: string }[];
  selected: string[];
  onToggle: (item: string) => void;
  withDescription?: boolean;
}) {
  return (
    <ul className="max-h-72 overflow-y-auto p-2">
      {withDescription
        ? (items as readonly { level: string; description: string }[]).map((item) => (
            <li key={item.level}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selected.includes(item.level)}
                  onChange={() => onToggle(item.level)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-gray-300 accent-brand"
                />
                <div>
                  <p className="text-sm font-medium text-charcoal">{item.level}</p>
                  <p className="mt-0.5 text-xs text-slate">{item.description}</p>
                </div>
              </label>
            </li>
          ))
        : (items as readonly string[]).map((label) => (
            <li key={label}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selected.includes(label)}
                  onChange={() => onToggle(label)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-gray-300 accent-brand"
                />
                <p className="text-sm font-medium text-charcoal">{label}</p>
              </label>
            </li>
          ))}
    </ul>
  );
}
