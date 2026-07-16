"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import CmsMediaPathField from "@/components/admin/CmsMediaPathField";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { SiteGlobalDefinition, SiteGlobalFieldDef } from "@/lib/cms/site-globals/registry";

type LocaleTab = "ru" | "en" | "es";

type Props = {
  definition: SiteGlobalDefinition;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  onSave: () => void;
  onReset?: () => void;
  savedValues?: Record<string, unknown>;
  saving?: boolean;
  updatedAt?: string | null;
};

const LOCALE_TAB_LABELS: Record<LocaleTab, string> = {
  ru: "RU",
  en: "EN",
  es: "ES",
};

function readLocaleValue(
  values: Record<string, unknown>,
  locale: LocaleTab,
  fieldName: string,
): unknown {
  if (locale === "ru") return values[fieldName];
  const locales = (values.locales as Record<string, Record<string, unknown>> | undefined) ?? {};
  return locales[locale]?.[fieldName];
}

export default function SiteGlobalForm({
  definition,
  values,
  onChange,
  onSave,
  onReset,
  savedValues,
  saving,
  updatedAt,
}: Props) {
  const hasTranslatableFields = definition.fields.some((field) => field.translatable);
  const [localeTab, setLocaleTab] = useState<LocaleTab>("ru");
  const hasUnsavedChanges = useMemo(
    () => savedValues !== undefined && JSON.stringify(values) !== JSON.stringify(savedValues),
    [savedValues, values],
  );

  const visibleFields = useMemo(() => {
    if (localeTab === "ru") return definition.fields;
    return definition.fields.filter((field) => field.translatable);
  }, [definition.fields, localeTab]);

  function setField(name: string, value: unknown) {
    onChange({ ...values, [name]: value });
  }

  function setLocaleField(locale: "en" | "es", name: string, value: unknown) {
    const locales = (values.locales as Record<string, Record<string, unknown>> | undefined) ?? {};
    onChange({
      ...values,
      locales: {
        ...locales,
        [locale]: {
          ...(locales[locale] ?? {}),
          [name]: value,
        },
      },
    });
  }

  function updateField(field: SiteGlobalFieldDef, value: unknown) {
    if (localeTab === "ru") {
      setField(field.name, value);
      return;
    }
    setLocaleField(localeTab, field.name, value);
  }

  function renderField(field: SiteGlobalFieldDef) {
    const value = readLocaleValue(values, localeTab, field.name);
    const fieldId = `site-global-${definition.key}-${localeTab}-${field.name}`.replaceAll(".", "-");
    const hintId = field.hint ? `${fieldId}-hint` : undefined;

    if (field.type === "checkbox") {
      return (
        <label
          key={`${localeTab}-${field.name}`}
          htmlFor={fieldId}
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-sm transition-colors hover:border-sky/30 hover:bg-sky/[0.04] sm:col-span-2"
        >
          <input
            id={fieldId}
            type="checkbox"
            checked={value === true}
            onChange={(e) => updateField(field, e.target.checked)}
            aria-describedby={hintId}
            className="h-5 w-5 shrink-0 cursor-pointer rounded border-border-subtle accent-sky-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
          />
          <span className="min-w-0">
            <span className="block font-medium text-foreground">{field.label}</span>
            {field.hint ? (
              <span id={hintId} className="mt-0.5 block text-xs leading-relaxed text-muted">
                {field.hint}
              </span>
            ) : null}
          </span>
        </label>
      );
    }

    if (field.type === "select") {
      const options = field.options ?? [];

      return (
        <label key={`${localeTab}-${field.name}`} htmlFor={fieldId} className="block text-sm">
          <span className="text-slate">{field.label}</span>
          {field.hint ? (
            <span id={hintId} className="ml-2 text-xs text-slate">{field.hint}</span>
          ) : null}
          <NativeSelect
            id={fieldId}
            className="mt-1"
            value={typeof value === "string" ? value : ""}
            onChange={(event) => updateField(field, event.target.value)}
            aria-describedby={hintId}
            required={field.required}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </NativeSelect>
        </label>
      );
    }

    if (field.type === "textarea") {
      return (
        <label key={`${localeTab}-${field.name}`} className="block text-sm sm:col-span-2">
          <span className="text-slate">{field.label}</span>
          {field.hint ? <span className="ml-2 text-xs text-slate">{field.hint}</span> : null}
          <textarea
            className="mt-1 min-h-[88px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => updateField(field, e.target.value)}
            placeholder={field.placeholder}
          />
        </label>
      );
    }

    if (field.type === "media") {
      return (
        <CmsMediaPathField
          key={`${localeTab}-${field.name}`}
          className="sm:col-span-2"
          label={field.label}
          hint={field.hint}
          placeholder={field.placeholder ?? "/media/... или https://"}
          value={typeof value === "string" ? value : ""}
          onChange={(next) => updateField(field, next)}
        />
      );
    }

    return (
      <label key={`${localeTab}-${field.name}`} className="block text-sm">
        <span className="text-slate">{field.label}</span>
        {field.hint ? <span className="ml-2 text-xs text-slate">{field.hint}</span> : null}
        <Input
          className="mt-1"
          type={field.type === "color" ? "color" : field.type === "email" ? "email" : "text"}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => updateField(field, e.target.value)}
          placeholder={field.placeholder}
        />
      </label>
    );
  }

  return (
    <section className={`${cabinetCardClass} space-y-4 p-5`}>
      <div>
        <h2 className="font-heading text-lg font-bold text-charcoal">{definition.label}</h2>
        <p className="mt-1 text-sm text-slate">{definition.description}</p>
        {updatedAt ? (
          <p className="mt-1 text-xs text-slate">Обновлено: {new Date(updatedAt).toLocaleString("ru-RU")}</p>
        ) : null}
      </div>

      {hasTranslatableFields ? (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(LOCALE_TAB_LABELS) as LocaleTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setLocaleTab(tab)}
              className={`inline-flex min-h-11 items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                localeTab === tab
                  ? "bg-sky-ink text-white"
                  : "bg-surface-elevated text-charcoal hover:bg-sky/10"
              }`}
            >
              {LOCALE_TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">{visibleFields.map(renderField)}</div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onSave} disabled={saving || !hasUnsavedChanges}>
          {saving ? "Сохранение…" : `Сохранить «${definition.label}»`}
        </Button>
        {onReset && hasUnsavedChanges ? (
          <Button type="button" variant="outline" onClick={onReset} disabled={saving}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Отменить правки
          </Button>
        ) : null}
      </div>
    </section>
  );
}
