"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({
  checked = false,
  onCheckedChange,
  className,
  disabled,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 overflow-hidden rounded-full p-0.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-sky" : "bg-gray-300",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export function SwitchRow({
  checked,
  onCheckedChange,
  label,
  labelAddon,
  className,
  disabled,
  align = "center",
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label: ReactNode;
  labelAddon?: ReactNode;
  className?: string;
  disabled?: boolean;
  align?: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "flex w-full gap-3 text-left",
        align === "start" ? "items-start" : "items-center",
        className
      )}
    >
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={align === "start" ? "mt-0.5 shrink-0" : "shrink-0"}
      />
      <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-semibold text-charcoal">
        {label}
        {labelAddon}
      </span>
    </div>
  );
}

export function SwitchField({
  checked,
  onCheckedChange,
  label,
  description,
  className,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label: string;
  description?: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex w-full items-start gap-3 text-left", className)}>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="mt-0.5"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-charcoal">{label}</span>
        {description ? (
          <span className="mt-1 block text-sm leading-relaxed text-slate">{description}</span>
        ) : null}
      </span>
    </div>
  );
}
