"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

type BlogHeroSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  className?: string;
};

export default function BlogHeroSearch({ value, onChange, onSubmit, className }: BlogHeroSearchProps) {
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative mt-6 max-w-xl rounded-2xl border border-gray-200/80 bg-white/90 p-1.5 shadow-sm backdrop-blur-sm",
        className,
      )}
      role="search"
      aria-label="Поиск по журналу"
    >
      <label htmlFor="blog-hero-search" className="sr-only">
        Поиск по блогу
      </label>
      <Search
        className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
        aria-hidden
      />
      <input
        id="blog-hero-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Patagonia, виза, malbec, треккинг…"
        className="blog-touch-target w-full rounded-xl border-0 bg-transparent py-3 pl-11 pr-4 text-sm text-charcoal outline-none placeholder:text-slate/70 focus:ring-2 focus:ring-sky/15"
      />
    </form>
  );
}
