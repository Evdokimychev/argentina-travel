"use client";

import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import OrganizerRichTextField from "@/components/organizer/OrganizerRichTextField";
import {
  ORGANIZER_TOUR_FAQ_ANSWER_MAX,
  ORGANIZER_TOUR_FAQ_MAX,
  ORGANIZER_TOUR_FAQ_QUESTION_MAX,
  createEmptyFaqItem,
  type OrganizerTourFAQ,
} from "@/data/tour-terms-defaults";
import { cn } from "@/lib/cn";

interface TourFAQBlockProps {
  items: OrganizerTourFAQ[];
  onChange: (items: OrganizerTourFAQ[]) => void;
}

function formatQuestionCount(count: number): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${count} вопросов`;
  if (mod10 === 1) return `${count} вопрос`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} вопроса`;
  return `${count} вопросов`;
}

export default function TourFAQBlock({ items, onChange }: TourFAQBlockProps) {
  const list = items.length ? items : [createEmptyFaqItem()];
  const canAdd = list.length < ORGANIZER_TOUR_FAQ_MAX;
  const canReorder = list.length > 1;

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function updateAt(index: number, item: OrganizerTourFAQ) {
    onChange(list.map((entry, itemIndex) => (itemIndex === index ? item : entry)));
  }

  function reorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
    const next = [...list];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    onChange(next);
  }

  function removeAt(index: number) {
    if (list.length <= 1) {
      onChange([createEmptyFaqItem()]);
      return;
    }
    onChange(list.filter((_, itemIndex) => itemIndex !== index));
  }

  function addItem() {
    if (!canAdd) return;
    onChange([...list, createEmptyFaqItem()]);
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

  function handleDragOver(index: number, event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragIndex !== null && index !== dragIndex) {
      setOverIndex(index);
    }
  }

  function handleDrop(index: number, event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    if (dragIndex === null) return;
    reorder(dragIndex, index);
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
            Часто задаваемые вопросы
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate">
            Каждый вопрос отображается на странице тура в том же порядке. В ответах доступно
            форматирование — списки, выделение и ссылки.
            {canReorder ? " Перетащите карточку за ручку слева, чтобы изменить порядок." : null}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-slate">
          {formatQuestionCount(list.length)}
        </span>
      </div>

      <div className="space-y-3">
        {list.map((item, index) => {
          const previewTitle = item.question.trim() || `Новый вопрос ${index + 1}`;

          return (
            <article
              key={item.id}
              data-faq-row
              onDragOver={(event) => handleDragOver(index, event)}
              onDrop={(event) => handleDrop(index, event)}
              className={cn(
                "overflow-hidden rounded-2xl border border-gray-200/80 bg-gray-50/50 transition-[box-shadow,opacity] duration-150",
                dragIndex === index && "opacity-50",
                overIndex === index && dragIndex !== null && dragIndex !== index && "ring-2 ring-brand/25"
              )}
            >
              <div className="flex items-center gap-2 border-b border-gray-200/70 bg-white px-3 py-2.5 sm:px-4">
                <button
                  type="button"
                  draggable={canReorder}
                  disabled={!canReorder}
                  onDragStart={(event) => handleDragStart(index, event)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "inline-flex h-8 w-7 shrink-0 items-center justify-center rounded-lg text-slate transition-colors",
                    canReorder
                      ? "cursor-grab touch-none active:cursor-grabbing hover:bg-gray-100 hover:text-charcoal"
                      : "cursor-default opacity-30"
                  )}
                  aria-label={`Перетащите вопрос ${index + 1} для изменения порядка`}
                >
                  <GripVertical className="h-4 w-4" aria-hidden />
                </button>

                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-charcoal">{previewTitle}</p>

                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-red-600 hover:bg-red-50"
                  aria-label={`Удалить вопрос ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-xs font-bold tabular-nums text-brand"
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm font-bold text-charcoal">Вопрос</span>
                  </div>

                  <div className="relative">
                    <label
                      htmlFor={`faq-question-${item.id}`}
                      className="pointer-events-none absolute left-3 top-0 z-10 -translate-y-1/2 bg-white px-1 text-xs font-medium text-slate"
                    >
                      Название вопроса
                    </label>
                    <Input
                      id={`faq-question-${item.id}`}
                      value={item.question}
                      maxLength={ORGANIZER_TOUR_FAQ_QUESTION_MAX}
                      onChange={(event) => updateAt(index, { ...item, question: event.target.value })}
                      placeholder="Нужна ли виза?"
                      className="h-14 bg-white pt-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold text-charcoal">Ответ</p>
                  <OrganizerRichTextField
                    id={`faq-answer-${item.id}`}
                    value={item.answer}
                    onChange={(answer) => updateAt(index, { ...item, answer })}
                    maxLength={ORGANIZER_TOUR_FAQ_ANSWER_MAX}
                    rows={8}
                    placeholder="Дайте короткий и понятный ответ для участников тура"
                  />
                </div>
              </div>
            </article>
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
          Добавить вопрос {list.length + 1}
        </button>
      ) : (
        <p className="text-sm text-slate">Достигнут лимит — не больше {ORGANIZER_TOUR_FAQ_MAX} вопросов.</p>
      )}
    </section>
  );
}
