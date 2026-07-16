"use client";

import { cloneElement, isValidElement, type ReactElement } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
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
  success,
  counter,
  required,
  optional,
  decorateControl = true,
  children,
  className,
  labelClassName,
  size = "default",
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  success?: string;
  counter?: string;
  required?: boolean;
  optional?: boolean;
  /** Отключает клонирование, когда children — составной контрол со своим aria-describedby. */
  decorateControl?: boolean;
  children: ReactElement<FormFieldControlProps>;
  className?: string;
  labelClassName?: string;
  size?: "default" | "sm";
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const successId = success && !error ? `${id}-success` : undefined;
  const counterId = counter ? `${id}-counter` : undefined;
  const describedBy = [hintId, errorId, successId, counterId].filter(Boolean).join(" ") || undefined;
  const childDescribedBy = isValidElement(children) ? children.props["aria-describedby"] : undefined;
  const mergedDescribedBy = [childDescribedBy, describedBy].filter(Boolean).join(" ") || undefined;
  const controlId = decorateControl && isValidElement(children) ? (children.props.id ?? id) : id;

  const control = decorateControl && isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        "aria-describedby": mergedDescribedBy,
        "aria-invalid": error ? true : children.props["aria-invalid"],
        "aria-required": required ? true : children.props["aria-required"],
      })
    : children;

  return (
    <div className={className}>
      <label
        htmlFor={controlId}
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
        ) : optional ? <span className="ml-1 font-normal text-muted">(необязательно)</span> : null}
      </label>
      {control}
      {hint ? (
        <p id={hintId} className="mt-1.5 text-xs leading-relaxed text-slate">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium leading-relaxed text-error">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span><span className="sr-only">Ошибка: </span>{error}</span>
        </p>
      ) : null}
      {success && !error ? (
        <p id={successId} role="status" className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-success">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{success}</span>
        </p>
      ) : null}
      {counter ? (
        <p id={counterId} className="mt-1 text-right text-[11px] tabular-nums text-muted">
          {counter}
        </p>
      ) : null}
    </div>
  );
}
