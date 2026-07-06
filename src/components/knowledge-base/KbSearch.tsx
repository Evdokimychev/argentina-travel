"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { kbTypeLabel } from "@/lib/knowledge-base/labels";
import type { KbSearchItem } from "@/lib/knowledge-base/types";
import { entryHref } from "@/lib/knowledge-base/urls";

const MAX_RESULTS = 40;

function score(item: KbSearchItem, q: string): number {
  const title = item.title.toLowerCase();
  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  if (title.includes(q)) return 60;
  if (item.aliases.some((a) => a.toLowerCase().includes(q))) return 40;
  if (item.tags.some((t) => t.toLowerCase().includes(q))) return 30;
  if (item.summary.toLowerCase().includes(q)) return 20;
  return 0;
}

/** Полноценный поиск по базе знаний (клиентская фильтрация). */
export default function KbSearch({
  items,
  initialQuery = "",
}: {
  items: KbSearchItem[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return items
      .map((item) => ({ item, s: score(item, q) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || a.item.title.localeCompare(b.item.title, "ru"))
      .slice(0, MAX_RESULTS)
      .map((r) => r.item);
  }, [items, query]);

  const q = query.trim();

  return (
    <div>
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        >
          🔍
        </span>
        <input
          type="search"
          value={query}
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Введите запрос: виза, аренда, бюджет, Патагония…"
          aria-label="Поиск по базе знаний"
          className="w-full rounded-full border border-border-subtle bg-surface-elevated py-3.5 pl-11 pr-4 text-base text-foreground shadow-card outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-sky/40"
        />
      </div>

      <div className="mt-5">
        {q.length < 2 ? (
          <p className="text-sm text-muted">
            Введите минимум два символа. Поиск идёт по названиям, синонимам и
            тегам всех {items.length} материалов базы.
          </p>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted">
            По запросу «{q}» ничего не найдено. Попробуйте другое слово или
            загляните в разделы базы.
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate">
              Найдено: {results.length}
              {results.length === MAX_RESULTS ? "+" : ""}
            </p>
            <ul className="space-y-2">
              {results.map((item) => (
                <li key={item.id}>
                  <Link
                    href={entryHref(item.id)}
                    className="card-hover block rounded-card border border-border-subtle bg-surface-elevated p-4 shadow-card transition-shadow duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 motion-reduce:transition-none"
                  >
                    <span className="mb-1 inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-2xs font-medium uppercase tracking-wide text-slate">
                      {kbTypeLabel(item.type)}
                    </span>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    {item.summary && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                        {item.summary}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
