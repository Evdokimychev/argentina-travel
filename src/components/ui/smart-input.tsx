"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Eye, EyeOff, X } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { FieldValidator } from "@/lib/form-validation";

type SmartInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  successMessage?: string;
  optional?: boolean;
  leadingIcon?: ReactNode;
  validate?: FieldValidator;
  onValueChange?: (value: string) => void;
  clearable?: boolean;
  showValidationSuccess?: boolean;
};

/**
 * Поле, которое объясняет требования до ввода и показывает конкретную ошибку
 * после blur/submit. Не отвлекает пользователя ошибками во время первого набора.
 */
export function SmartInput({
  id,
  label,
  hint,
  error,
  successMessage = "Готово",
  optional,
  leadingIcon,
  validate,
  onValueChange,
  clearable = false,
  showValidationSuccess = true,
  type = "text",
  value,
  defaultValue,
  onChange,
  onBlur,
  onInvalid,
  className,
  required,
  disabled,
  readOnly,
  ...props
}: SmartInputProps) {
  const [draft, setDraft] = useState(() => String(value ?? defaultValue ?? ""));
  const [touched, setTouched] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    if (value !== undefined) setDraft(String(value));
  }, [value]);

  const localError = touched && validate ? validate(draft) : null;
  const resolvedError = error || localError || null;
  const valid = touched && Boolean(draft) && !resolvedError && Boolean(validate);
  const isPassword = type === "password";
  const hasEndControl = isPassword || (clearable && Boolean(draft));
  const describedBy = [hint ? `${id}-hint` : null, resolvedError ? `${id}-error` : null, valid ? `${id}-success` : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <FormField
      id={id}
      label={label}
      hint={hint}
      error={resolvedError ?? undefined}
      success={valid && showValidationSuccess ? successMessage : undefined}
      required={required}
      optional={optional}
      decorateControl={false}
    >
      <div className="relative">
        {leadingIcon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted" aria-hidden>
            {leadingIcon}
          </span>
        ) : null}
        <Input
          {...props}
          id={id}
          type={isPassword && passwordVisible ? "text" : type}
          value={draft}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={resolvedError ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={cn(
            "transition-[border-color,box-shadow,background-color]",
            leadingIcon && "pl-10",
            hasEndControl && "pr-11",
            valid && "border-success/60 focus-visible:border-success focus-visible:ring-success/20",
            className,
          )}
          onChange={(event) => {
            setDraft(event.target.value);
            onValueChange?.(event.target.value);
            onChange?.(event);
          }}
          onBlur={(event) => {
            setTouched(true);
            onBlur?.(event);
          }}
          onInvalid={(event) => {
            setTouched(true);
            onInvalid?.(event);
          }}
        />
        {isPassword ? (
          <button
            type="button"
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-label={passwordVisible ? "Скрыть пароль" : "Показать пароль"}
          >
            {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : clearable && draft ? (
          <button
            type="button"
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
            onClick={() => {
              setDraft("");
              setTouched(false);
              onValueChange?.("");
            }}
            aria-label={`Очистить поле «${label}»`}
          >
            <X className="h-4 w-4" />
          </button>
        ) : valid && showValidationSuccess ? (
          <CheckCircle2 className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-success" aria-hidden />
        ) : null}
      </div>
    </FormField>
  );
}
