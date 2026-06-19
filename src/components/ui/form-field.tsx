"use client";

import { cloneElement, isValidElement, type ReactElement } from "react";
import { cn } from "@/lib/cn";

type FormFieldControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
};

export function FormField({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
  labelClassName,
  size = "default",
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactElement<FormFieldControlProps>;
  className?: string;
  labelClassName?: string;
  size?: "default" | "sm";
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : children.props["aria-invalid"],
        "aria-required": required ? true : children.props["aria-required"],
      })
    : children;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cn(
          "mb-1.5 block font-medium text-charcoal",
          size === "sm" ? "text-xs" : "text-sm",
          labelClassName
        )}
      >
        {label}
        {required ? (
          <>
            <span className="text-brand" aria-hidden="true"> *</span>
            <span className="sr-only"> (обязательное поле)</span>
          </>
        ) : null}
      </label>
      {control}
      {hint ? (
        <p id={hintId} className="mt-1.5 text-xs leading-relaxed text-slate">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
