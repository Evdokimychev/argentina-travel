"use client";

import { useRef, useState } from "react";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ORGANIZER_TOUR_TERMS_ITEMS_MAX,
  ORGANIZER_TOUR_TERMS_ITEM_MAX,
} from "@/data/tour-terms-defaults";
import {
  ORGANIZER_TOUR_TERMS_ITEM_DETAIL_MAX,
  parseTourTermItem,
  serializeTourTermItem,
  type ParsedTourTermItem,
} from "@/lib/tour-terms-items";
import { cn } from "@/lib/cn";

interface TourTermsListBlockProps {
  title: string;
  description?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  detailPlaceholder?: string;
  addLabel?: string;
  variant?: "standalone" | "embedded";
  maxItems?: number;
}

function createRowKey() {
  return `term-${Math.random().toString(36).slice(2, 11)}`;
}

function formatTermsItemCount(count: number): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${count} пунктов`;
  if (mod10 === 1) return `${count} пункт`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} пункта`;
  return `${count} пунктов`;
}

function toParsedItems(items: string[]): ParsedTourTermItem[] {
  const parsed = items.map(parseTourTermItem);
  return parsed.length ? parsed : [{ title: "" }];
}

export default function TourTermsListBlock({
  title,
  description,
  items,
  onChange,
  placeholder = "Введите пункт",
  detailPlaceholder = "Краткое пояснение для туриста (необязательно)",
  addLabel = "Добавить пункт",
  variant = "standalone",
  maxItems = ORGANIZER_TOUR_TERMS_ITEMS_MAX,
}: TourTermsListBlockProps) {
  const list = toParsedItems(items);
  const canAdd = list.length < maxItems;
  const embedded = variant === "embedded";
  const canReorder = list.length > 1;

  const keysRef = useRef<string[]>([]);
  while (keysRef.current.length < list.length) {
    keysRef.current.push(createRowKey());
  }
  keysRef.current.length = list.length;

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<number, boolean>>({});

  function emit(next: ParsedTourTermItem[]) {
    onChange(next.map(serializeTourTermItem));
  }

  function updateAt(index: number, patch: Partial<ParsedTourTermItem>) {
    emit(list.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function reorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
    const next = [...list];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);

    const nextKeys = [...keysRef.current];
    const [removedKey] = nextKeys.splice(from, 1);
    nextKeys.splice(to, 0, removedKey);
    keysRef.current = nextKeys;

    emit(next);
  }

  function removeAt(index: number) {
    keysRef.current = keysRef.current.filter((_, itemIndex) => itemIndex !== index);
    emit(list.filter((_, itemIndex) => itemIndex !== index));
  }

  function addItem() {
    if (!canAdd) return;
    keysRef.current.push(createRowKey());
    emit([...list, { title: "" }]);
  }

  function toggleDetail(index: number) {
    setExpandedDetails((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  function handleDragStart(index: number, event: React.DragEvent<HTMLButtonElement>) {
    setDragIndex(index);
    setOverIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragOver(index: number, event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragIndex !== null && index !== dragIndex) {
      setOverIndex(index);
    }
  }

  function handleDrop(index: number, event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (dragIndex === null) return;
    reorder(dragIndex, index);
    setDragIndex(null);
    setOverIndex(null);
  }

  const content = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className={cn(
              "font-bold text-charcoal",
              embedded ? "text-base" : "font-heading text-xl sm:text-2xl"
            )}
          >
            {title}
          </h3>
          {description ? <p className="mt-1 text-sm text-slate">{description}</p> : null}
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-slate">
          {formatTermsItemCount(list.length)}
        </span>
      </div>

      <div className="space-y-3">
        {list.map((item, index) => {
          const detailOpen = expandedDetails[index] || Boolean(item.detail?.trim());
          return (
            <div
              key={keysRef.current[index]}
              data-term-row
              onDragOver={(event) => handleDragOver(index, event)}
              onDrop={(event) => handleDrop(index, event)}
              className={cn(
                "rounded-xl border border-gray-200/80 bg-white p-2.5 transition-[box-shadow,opacity] duration-150",
                dragIndex === index && "opacity-50",
                overIndex === index && dragIndex !== null && dragIndex !== index && "ring-2 ring-brand/25"
              )}
            >
              <div className="flex items-start gap-1.5">
                <button
                  type="button"
                  draggable={canReorder}
                  disabled={!canReorder}
                  onDragStart={(event) => handleDragStart(index, event)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "mt-0.5 inline-flex h-9 w-7 shrink-0 items-center justify-center rounded-lg text-slate transition-colors",
                    canReorder
                      ? "cursor-grab touch-none active:cursor-grabbing hover:bg-gray-100 hover:text-charcoal"
                      : "cursor-default opacity-30"
                  )}
                  aria-label="Перетащите для изменения порядка"
                >
                  <GripVertical className="h-4 w-4" aria-hidden />
                </button>
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    value={item.title}
                    maxLength={ORGANIZER_TOUR_TERMS_ITEM_MAX}
                    placeholder={placeholder}
                    onChange={(event) => updateAt(index, { title: event.target.value })}
                    className="bg-white"
                  />
                  {detailOpen ? (
                    <textarea
                      value={item.detail ?? ""}
                      maxLength={ORGANIZER_TOUR_TERMS_ITEM_DETAIL_MAX}
                      placeholder={detailPlaceholder}
                      rows={2}
                      onChange={(event) => updateAt(index, { detail: event.target.value })}
                      className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal placeholder:text-slate/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleDetail(index)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand/80"
                    >
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                      Добавить пояснение
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  disabled={list.length <= 1 && !item.title.trim() && !item.detail?.trim()}
                  className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-red-600 disabled:opacity-40"
                  aria-label="Удалить"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
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
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      {content}
    </section>
  );
}
