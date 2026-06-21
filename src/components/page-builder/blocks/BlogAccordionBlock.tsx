"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  items: Array<{ title: string; body: string }>;
};

export default function BlogAccordionBlock({ items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const filtered = items.filter((item) => item.title.trim() || item.body.trim());
  if (filtered.length === 0) return null;

  return (
    <div className="space-y-2">
      {filtered.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={index} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-charcoal"
              onClick={() => setOpenIndex(open ? null : index)}
              aria-expanded={open}
            >
              {item.title || `Пункт ${index + 1}`}
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate transition", open && "rotate-180")} />
            </button>
            {open ? (
              <div className="border-t border-gray-100 px-4 py-3 text-sm leading-relaxed text-slate">
                {item.body}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
