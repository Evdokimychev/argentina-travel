"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type BlogContentTableProps = {
  headers: string[];
  rows: string[][];
  caption?: string;
  className?: string;
};

export default function BlogContentTable({
  headers,
  rows,
  caption,
  className,
}: BlogContentTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const hintId = useId();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      setOverflows(el.scrollWidth > el.clientWidth + 1);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [headers, rows]);

  if (headers.length === 0 && rows.length === 0) return null;

  return (
    <figure className={cn("not-prose", className)}>
      {overflows ? (
        <p id={hintId} className="mb-2 text-xs text-slate sm:hidden">
          Прокрутите таблицу вправо →
        </p>
      ) : null}
      <div
        ref={scrollRef}
        className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm overscroll-x-contain"
        role="region"
        aria-label={caption ?? "Таблица"}
        aria-describedby={overflows ? hintId : undefined}
        tabIndex={0}
      >
        <table className="w-full min-w-[480px] text-left text-sm">
          {caption ? (
            <caption className="border-b border-gray-100 bg-surface-muted/50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate">
              {caption}
            </caption>
          ) : null}
          {headers.length > 0 ? (
            <thead>
              <tr className="border-b border-gray-100 bg-surface-muted/60">
                {headers.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-4 py-3 font-heading text-sm font-bold text-charcoal"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-50 last:border-0">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      "px-4 py-3 text-slate",
                      cellIndex === 0 && "font-medium text-charcoal",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
