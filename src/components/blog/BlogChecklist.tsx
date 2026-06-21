import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BlogChecklistItem } from "@/types/blog-content-blocks";

type BlogChecklistProps = {
  items: BlogChecklistItem[];
  title?: string;
  className?: string;
};

export default function BlogChecklist({ items, title, className }: BlogChecklistProps) {
  if (items.length === 0) return null;

  const hasNegative = items.some((item) => item.negative);

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
      role="region"
      aria-label={title ?? "Контрольный список"}
    >
      {title ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate/80">
          {title}
        </p>
      ) : null}
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.text} className="flex items-start gap-3 text-sm leading-relaxed text-slate">
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                item.negative
                  ? "border-red-200 bg-red-50 text-red-600"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
              )}
              aria-hidden
            >
              {item.negative ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
            <span className={cn(item.negative && "text-charcoal/90")}>{item.text}</span>
          </li>
        ))}
      </ul>
      {hasNegative ? (
        <p className="mt-3 text-xs text-slate/80">
          Пункты с крестом — то, что лучше не брать или не делать.
        </p>
      ) : null}
    </div>
  );
}
