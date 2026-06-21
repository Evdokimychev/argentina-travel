"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { SiteGlobalDefinition } from "@/lib/cms/site-globals/registry";

type Props = {
  definition: SiteGlobalDefinition;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  onSave: () => void;
  saving?: boolean;
  updatedAt?: string | null;
};

export default function SiteGlobalForm({
  definition,
  values,
  onChange,
  onSave,
  saving,
  updatedAt,
}: Props) {
  function setField(name: string, value: unknown) {
    onChange({ ...values, [name]: value });
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

      <div className="grid gap-3 sm:grid-cols-2">
        {definition.fields.map((field) => {
          const value = values[field.name];

          if (field.type === "checkbox") {
            return (
              <label key={field.name} className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={value === true}
                  onChange={(e) => setField(field.name, e.target.checked)}
                />
                {field.label}
              </label>
            );
          }

          if (field.type === "textarea") {
            return (
              <label key={field.name} className="block text-sm sm:col-span-2">
                <span className="text-slate">{field.label}</span>
                {field.hint ? <span className="ml-2 text-xs text-slate">{field.hint}</span> : null}
                <textarea
                  className="mt-1 min-h-[88px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
                  value={typeof value === "string" ? value : ""}
                  onChange={(e) => setField(field.name, e.target.value)}
                  placeholder={field.placeholder}
                />
              </label>
            );
          }

          return (
            <label key={field.name} className="block text-sm">
              <span className="text-slate">{field.label}</span>
              {field.hint ? <span className="ml-2 text-xs text-slate">{field.hint}</span> : null}
              <Input
                className="mt-1"
                type={field.type === "color" ? "color" : field.type === "email" ? "email" : "text"}
                value={typeof value === "string" ? value : ""}
                onChange={(e) => setField(field.name, e.target.value)}
                placeholder={field.placeholder}
              />
            </label>
          );
        })}
      </div>

      <Button type="button" onClick={onSave} disabled={saving}>
        {saving ? "Сохранение…" : `Сохранить «${definition.label}»`}
      </Button>
    </section>
  );
}
