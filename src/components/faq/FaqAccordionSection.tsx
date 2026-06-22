"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import type { FaqItem } from "@/data/faq";

type FaqAccordionSectionProps = {
  items: FaqItem[];
  className?: string;
};

export default function FaqAccordionSection({ items, className }: FaqAccordionSectionProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) return items;
    return items.filter(
      (item) =>
        item.question.toLowerCase().includes(normalizedQuery) ||
        item.answer.toLowerCase().includes(normalizedQuery)
    );
  }, [items, normalizedQuery]);

  return (
    <div className={className}>
      <label className="relative block">
        <span className="sr-only">Поиск по вопросам</span>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Найти вопрос…"
          className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-charcoal shadow-sm placeholder:text-slate/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
        />
      </label>

      {filteredItems.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-8 text-center text-sm text-slate">
          Ничего не найдено — попробуйте другие слова или{" "}
          <a href="/contacts" className="font-medium text-sky hover:underline">
            напишите нам
          </a>
          .
        </p>
      ) : (
        <div
          className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-card"
          role="region"
          aria-label="Часто задаваемые вопросы"
        >
          {filteredItems.map((item) => (
            <details key={item.question} className="group px-4 py-1 sm:px-5 sm:py-2">
              <summary className="blog-touch-target -mx-1 cursor-pointer list-none rounded-lg px-1 font-medium text-charcoal marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-3">
                  <span className="text-sm sm:text-[0.9375rem]">{item.question}</span>
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky/10 text-sm font-bold text-sky transition",
                      "group-open:rotate-45 motion-reduce:transition-none motion-reduce:group-open:rotate-0"
                    )}
                    aria-hidden
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate sm:text-[0.9375rem]">{item.answer}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
