"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type LinkItemDraft = {
  label: string;
  href: string;
  description?: string;
};

type Props = {
  items: LinkItemDraft[];
  onChange: (items: LinkItemDraft[]) => void;
  addLabel?: string;
};

export default function LinkItemsEditor({
  items,
  onChange,
  addLabel = "+ Ссылка",
}: Props) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded-xl border border-gray-100 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">
              Пункт {index + 1}
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-red-600"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Удалить
            </Button>
          </div>
          <Input
            value={item.label}
            onChange={(e) => {
              const next = [...items];
              next[index] = { ...item, label: e.target.value };
              onChange(next);
            }}
            placeholder="Название"
          />
          <Input
            value={item.href}
            onChange={(e) => {
              const next = [...items];
              next[index] = { ...item, href: e.target.value };
              onChange(next);
            }}
            placeholder="/path или https://…"
            className="font-mono text-xs"
          />
          <Textarea
            value={item.description ?? ""}
            onChange={(e) => {
              const next = [...items];
              next[index] = {
                ...item,
                description: e.target.value.trim() ? e.target.value : undefined,
              };
              onChange(next);
            }}
            placeholder="Краткое описание (необязательно)"
            className="min-h-[56px]"
          />
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange([...items, { label: "", href: "" }])}
      >
        {addLabel}
      </Button>
    </div>
  );
}
