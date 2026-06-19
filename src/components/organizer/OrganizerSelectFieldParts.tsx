"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function PopoverFieldTrigger({
  className,
  align = "between",
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  align?: "start" | "between";
}) {
  return (
    <div
      role="combobox"
      tabIndex={0}
      className={cn(
        "relative flex min-h-14 w-full cursor-pointer rounded-2xl border border-gray-200 bg-white px-3 pb-2.5 pt-6 text-left transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20",
        align === "start" ? "items-start justify-between gap-2" : "items-center justify-between gap-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectionChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-charcoal">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className="text-slate transition-colors hover:text-charcoal"
        aria-label={`Убрать ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export function ClearFieldButton({
  onClear,
  label = "Очистить",
}: {
  onClear: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClear();
      }}
      className="rounded p-0.5 text-slate transition-colors hover:text-charcoal"
      aria-label={label}
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export function FieldFloatingLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className="absolute left-3 top-2 text-[11px] font-medium text-slate">
      {children}
      {required ? " *" : null}
    </span>
  );
}
