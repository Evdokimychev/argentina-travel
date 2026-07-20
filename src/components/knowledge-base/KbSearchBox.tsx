"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Компактная строка поиска — ведёт на страницу результатов. */
export default function KbSearchBox({
  placeholder = "Поиск по базе знаний…",
  autoFocus = false,
}: {
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const q = value.trim();
    router.push(q ? `/baza-znaniy/poisk?q=${encodeURIComponent(q)}` : "/baza-znaniy/poisk");
  }

  return (
    <form onSubmit={onSubmit} role="search" className="relative w-full">
      <span
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
      >
        🔍
      </span>
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Поиск по базе знаний"
        className="w-full rounded-full border border-border-subtle bg-surface-elevated py-3 pl-11 pr-12 text-sm text-foreground shadow-card outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-sky/40"
      />
      <button
        type="submit"
        aria-label="Найти в базе знаний"
        className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-sky-pale text-lg font-semibold text-sky-ink transition hover:bg-sky/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
      >
        →
      </button>
    </form>
  );
}
