"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BlogInlineText } from "@/components/blog/BlogLinkifiedText";
import { cn } from "@/lib/cn";

type BlogContentTableProps = {
  headers: string[];
  rows: string[][];
  caption?: string;
  className?: string;
  /**
   * Mobile presentation. `cards` turns each row into a stacked card (no horizontal scroll).
   * Desktop always uses a table.
   */
  mobileLayout?: "scroll" | "cards";
};

export default function BlogContentTable({
  headers,
  rows,
  caption,
  className,
  mobileLayout = "scroll",
}: BlogContentTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const hintId = useId();
  const useCards = mobileLayout === "cards";

  useEffect(() => {
    if (useCards) return;
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
  }, [headers, rows, useCards]);

  if (headers.length === 0 && rows.length === 0) return null;

  const table = (
    <div
      ref={useCards ? undefined : scrollRef}
      className={cn(
        "overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm overscroll-x-contain",
        useCards && "hidden sm:block",
      )}
      role="region"
      aria-label={caption ?? "Таблица"}
      aria-describedby={!useCards && overflows ? hintId : undefined}
      tabIndex={useCards ? undefined : 0}
    >
      <table className={cn("w-full text-left text-sm", !useCards && "min-w-[480px]")}>
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
                  <BlogInlineText text={header} linkify />
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
                  <BlogInlineText text={cell} linkify />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const cards =
    useCards && headers.length >= 2 ? (
      <ul className="space-y-2.5 sm:hidden" aria-label={caption ?? "Сравнение"}>
        {rows.map((row, rowIndex) => {
          const goal = row[0] ?? "";
          const window = row[1] ?? "";
          const note = row[2];
          return (
            <li
              key={`${goal}-${rowIndex}`}
              className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm"
            >
              <p className="text-sm font-semibold leading-snug text-charcoal">
                <BlogInlineText text={goal} linkify />
              </p>
              {window ? (
                <p className="mt-2 text-base font-medium leading-snug text-sky">
                  <BlogInlineText text={window} linkify />
                </p>
              ) : null}
              {note ? (
                <p className="mt-1.5 text-xs leading-relaxed text-slate">
                  <BlogInlineText text={note} linkify />
                </p>
              ) : headers.length > 2 && row.slice(2).some(Boolean) ? (
                <dl className="mt-2 space-y-1.5">
                  {row.slice(2).map((cell, cellIndex) =>
                    cell ? (
                      <div key={cellIndex}>
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate">
                          {headers[cellIndex + 2]}
                        </dt>
                        <dd className="text-xs leading-relaxed text-slate">
                          <BlogInlineText text={cell} linkify />
                        </dd>
                      </div>
                    ) : null,
                  )}
                </dl>
              ) : null}
            </li>
          );
        })}
      </ul>
    ) : null;

  return (
    <figure className={cn("not-prose", className)}>
      {!useCards && overflows ? (
        <p id={hintId} className="mb-2 text-xs text-slate sm:hidden">
          Прокрутите таблицу вправо →
        </p>
      ) : null}
      {cards}
      {table}
    </figure>
  );
}
