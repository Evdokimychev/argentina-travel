"use client";

import Link from "next/link";
import { Link2 } from "lucide-react";
import { suggestBlogPostInternalLinks } from "@/lib/blog-internal-link-suggestions";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { BlogPostSection } from "@/types";

type BlogInternalLinksPreviewProps = {
  excerpt: string;
  sections: BlogPostSection[];
  content?: string;
};

export default function BlogInternalLinksPreview({
  excerpt,
  sections,
  content,
}: BlogInternalLinksPreviewProps) {
  const suggestions = suggestBlogPostInternalLinks({ excerpt, sections, content });

  return (
    <section className={`${cabinetCardClass} p-4`}>
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-sky" aria-hidden />
        <h2 className="text-sm font-semibold text-charcoal">Автоперелинковка</h2>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-slate">
        Первое вхождение термина на публичной странице станет ссылкой. Проверьте, что формулировки
        уместны.
      </p>

      {suggestions.length === 0 ? (
        <p className="mt-3 text-xs text-slate">Совпадений по словарю правил пока нет.</p>
      ) : (
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-xs">
          {suggestions.map((item) => (
            <li
              key={`${item.href}-${item.label}`}
              className="rounded-lg border border-gray-100 bg-surface-muted/50 px-3 py-2"
            >
              <p className="font-medium text-charcoal">
                «{item.label}» →{" "}
                <Link href={item.href} className="text-sky hover:underline" target="_blank">
                  {item.href}
                </Link>
              </p>
              <p className="mt-1 text-slate/90">{item.context}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
