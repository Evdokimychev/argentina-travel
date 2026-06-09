"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ORGANIZER_TOUR_TERMS_ITEMS_MAX, ORGANIZER_TOUR_TERMS_ITEM_MAX } from "@/data/tour-terms-defaults";

interface TourTermsListBlockProps {
  title: string;
  description?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}

export default function TourTermsListBlock({
  title,
  description,
  items,
  onChange,
  placeholder = "Введите пункт",
  addLabel = "Добавить пункт",
}: TourTermsListBlockProps) {
  const canAdd = items.length < ORGANIZER_TOUR_TERMS_ITEMS_MAX;

  function updateAt(index: number, value: string) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function addItem() {
    if (!canAdd) return;
    onChange([...items, ""]);
  }

  const list = items.length ? items : [""];

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate">{description}</p> : null}
      </div>

      <div className="space-y-3">
        {list.map((item, index) => (
          <div key={`${title}-${index}`} className="flex items-start gap-2">
            <Input
              value={item}
              maxLength={ORGANIZER_TOUR_TERMS_ITEM_MAX}
              placeholder={placeholder}
              onChange={(event) => updateAt(index, event.target.value)}
              className="min-w-0 flex-1"
            />
            <div className="flex shrink-0 items-center gap-1 pt-0.5">
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white disabled:opacity-40"
                aria-label="Выше"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === list.length - 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white disabled:opacity-40"
                aria-label="Ниже"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={list.length <= 1 && !item.trim()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-red-600 disabled:opacity-40"
                aria-label="Удалить"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {canAdd ? (
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand/10 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/15"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      ) : (
        <p className="text-sm text-slate">Достигнут лимит — не больше {ORGANIZER_TOUR_TERMS_ITEMS_MAX} пунктов.</p>
      )}
    </section>
  );
}
