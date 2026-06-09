"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ORGANIZER_TOUR_FAQ_ANSWER_MAX,
  ORGANIZER_TOUR_FAQ_MAX,
  ORGANIZER_TOUR_FAQ_QUESTION_MAX,
  createEmptyFaqItem,
  type OrganizerTourFAQ,
} from "@/data/tour-terms-defaults";

interface TourFAQBlockProps {
  items: OrganizerTourFAQ[];
  onChange: (items: OrganizerTourFAQ[]) => void;
}

export default function TourFAQBlock({ items, onChange }: TourFAQBlockProps) {
  const canAdd = items.length < ORGANIZER_TOUR_FAQ_MAX;
  const list = items.length ? items : [createEmptyFaqItem()];

  function updateAt(index: number, item: OrganizerTourFAQ) {
    onChange(list.map((entry, itemIndex) => (itemIndex === index ? item : entry)));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
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

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
          Часто задаваемые вопросы
        </h2>
        <p className="mt-1 text-sm text-slate">
          Добавьте ответы на типичные вопросы — они появятся в блоке FAQ на странице тура
        </p>
      </div>

      <div className="space-y-4">
        {list.map((item, index) => (
          <article
            key={item.id}
            className="space-y-3 rounded-2xl border border-gray-200/80 bg-white p-4"
          >
            <div className="relative">
              <label
                htmlFor={`faq-question-${item.id}`}
                className="pointer-events-none absolute left-3 top-0 z-10 -translate-y-1/2 bg-white px-1 text-xs font-medium text-slate"
              >
                Вопрос*
              </label>
              <Input
                id={`faq-question-${item.id}`}
                value={item.question}
                maxLength={ORGANIZER_TOUR_FAQ_QUESTION_MAX}
                onChange={(event) => updateAt(index, { ...item, question: event.target.value })}
                placeholder="Нужна ли виза?"
                className="h-14 pt-1"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor={`faq-answer-${item.id}`} className="text-xs font-medium text-slate">
                Ответ*
              </label>
              <textarea
                id={`faq-answer-${item.id}`}
                value={item.answer}
                maxLength={ORGANIZER_TOUR_FAQ_ANSWER_MAX}
                rows={4}
                onChange={(event) => updateAt(index, { ...item, answer: event.target.value })}
                placeholder="Кратко опишите ответ для участников тура"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm leading-relaxed text-charcoal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 pt-3">
              <span className="mr-auto text-xs text-slate">Изменить порядок</span>
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-red-600"
                aria-label="Удалить вопрос"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {canAdd ? (
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Добавить вопрос
        </button>
      ) : (
        <p className="text-sm text-slate">Достигнут лимит — не больше {ORGANIZER_TOUR_FAQ_MAX} вопросов.</p>
      )}
    </section>
  );
}
