"use client";

import { useEffect, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import {
  getBlogArticleFeedback,
  setBlogArticleFeedback,
  type BlogArticleFeedbackValue,
} from "@/lib/blog-article-feedback-store";
import { trackBlogArticleFeedback } from "@/lib/analytics/gtm-events";
import { cn } from "@/lib/cn";

type BlogArticleFeedbackProps = {
  slug: string;
  title: string;
  className?: string;
};

export default function BlogArticleFeedback({ slug, title, className }: BlogArticleFeedbackProps) {
  const [value, setValue] = useState<BlogArticleFeedbackValue | null>(null);

  useEffect(() => {
    setValue(getBlogArticleFeedback(slug));
  }, [slug]);

  function submit(next: BlogArticleFeedbackValue) {
    setBlogArticleFeedback(slug, next);
    setValue(next);
    trackBlogArticleFeedback({ slug, title, value: next });
  }

  return (
    <aside
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
      aria-label="Оценка материала"
    >
      <p className="text-sm font-medium text-charcoal">Было полезно?</p>
      <p className="mt-1 text-xs text-slate">Ваш отклик помогает улучшать журнал</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={value === "helpful"}
          onClick={() => submit("helpful")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            value === "helpful"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-gray-200 bg-white text-slate hover:border-emerald-200 hover:text-emerald-800",
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
          Да
        </button>
        <button
          type="button"
          aria-pressed={value === "not_helpful"}
          onClick={() => submit("not_helpful")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            value === "not_helpful"
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-gray-200 bg-white text-slate hover:border-amber-200 hover:text-amber-900",
          )}
        >
          <ThumbsDown className="h-3.5 w-3.5" aria-hidden />
          Мало пользы
        </button>
      </div>
      {value ? (
        <p className="mt-3 text-xs text-slate">Спасибо за отклик — учтём при обновлении материала.</p>
      ) : null}
    </aside>
  );
}
