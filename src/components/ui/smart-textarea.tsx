"use client";

import { useEffect, useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import type { FieldValidator } from "@/lib/form-validation";

type SmartTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  validate?: FieldValidator;
  onValueChange?: (value: string) => void;
};

export function SmartTextarea({
  id, label, hint, error, optional, validate, value, defaultValue,
  maxLength, required, onValueChange, onChange, onBlur, onInvalid, ...props
}: SmartTextareaProps) {
  const [draft, setDraft] = useState(() => String(value ?? defaultValue ?? ""));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (value !== undefined) setDraft(String(value));
  }, [value]);

  const resolvedError = error || (touched && validate ? validate(draft) : null);
  const valid = touched && Boolean(draft.trim()) && !resolvedError && Boolean(validate);
  const showCounter = Boolean(maxLength && draft.length >= Math.floor(maxLength * 0.7));
  const describedBy = [hint ? `${id}-hint` : null, resolvedError ? `${id}-error` : null,
    valid ? `${id}-success` : null, showCounter ? `${id}-counter` : null]
    .filter(Boolean).join(" ") || undefined;

  return (
    <FormField id={id} label={label} hint={hint} error={resolvedError ?? undefined}
      success={valid ? "Готово" : undefined}
      counter={showCounter ? `${draft.length} из ${maxLength}` : undefined}
      required={required} optional={optional} decorateControl={false}>
      <Textarea {...props} id={id} value={draft} maxLength={maxLength} required={required}
        aria-required={required || undefined} aria-invalid={resolvedError ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => { setDraft(event.target.value); onValueChange?.(event.target.value); onChange?.(event); }}
        onBlur={(event) => { setTouched(true); onBlur?.(event); }}
        onInvalid={(event) => { setTouched(true); onInvalid?.(event); }} />
    </FormField>
  );
}
