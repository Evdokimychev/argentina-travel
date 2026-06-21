"use client";

import { cn } from "@/lib/cn";

type BlogFaqItem = {
  question: string;
  answer: string;
};

type BlogFaqSectionProps = {
  items: BlogFaqItem[];
  className?: string;
};

export default function BlogFaqSection({ items, className }: BlogFaqSectionProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm",
        className,
      )}
      role="region"
      aria-label="Часто задаваемые вопросы"
    >
      {items.map((item) => (
        <details key={item.question} className="group px-4 py-1 sm:px-5 sm:py-2">
          <summary
            className="blog-touch-target -mx-1 cursor-pointer list-none rounded-lg px-1 font-medium text-charcoal marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="text-sm sm:text-[0.9375rem]">{item.question}</span>
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky/10 text-sm font-bold text-sky transition group-open:rotate-45 motion-reduce:transition-none motion-reduce:group-open:rotate-0"
                aria-hidden
              >
                +
              </span>
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-slate sm:text-[0.9375rem]">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
