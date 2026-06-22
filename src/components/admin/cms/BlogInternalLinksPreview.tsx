"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Link2, Sparkles } from "lucide-react";
import { suggestBlogPostInternalLinks } from "@/lib/blog-internal-link-suggestions";
import type { BlogAiLinkSuggestion } from "@/lib/blog-ai-link-suggestions";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { BlogPostSection } from "@/types";

type BlogInternalLinksPreviewProps = {
  excerpt: string;
  sections: BlogPostSection[];
  content?: string;
  slug?: string;
};

export default function BlogInternalLinksPreview({
  excerpt,
  sections,
  content,
  slug,
}: BlogInternalLinksPreviewProps) {
  const ruleSuggestions = suggestBlogPostInternalLinks({ excerpt, sections, content });
  const [aiSuggestions, setAiSuggestions] = useState<BlogAiLinkSuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);

  const loadAiSuggestions = useCallback(async () => {
    setAiLoading(true);
    try {
      const response = await fetch("/api/cms/blog/link-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excerpt, sections, content, slug }),
      });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        aiSuggestions?: BlogAiLinkSuggestion[];
        aiEnabled?: boolean;
      };
      setAiSuggestions(Array.isArray(payload.aiSuggestions) ? payload.aiSuggestions : []);
      setAiEnabled(Boolean(payload.aiEnabled));
    } catch {
      setAiSuggestions([]);
    } finally {
      setAiLoading(false);
    }
  }, [content, excerpt, sections, slug]);

  useEffect(() => {
    void loadAiSuggestions();
  }, [loadAiSuggestions]);

  const mergedAi = aiSuggestions.filter(
    (item) => !ruleSuggestions.some((rule) => rule.href === item.href),
  );

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

      {ruleSuggestions.length === 0 ? (
        <p className="mt-3 text-xs text-slate">Совпадений по словарю правил пока нет.</p>
      ) : (
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-xs">
          {ruleSuggestions.map((item) => (
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

      <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4">
        <Sparkles className="h-4 w-4 text-sky" aria-hidden />
        <h3 className="text-sm font-semibold text-charcoal">AI-подсказки</h3>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-slate">
        Дополнительные ссылки по теме статьи{aiEnabled ? "" : " (без OpenAI — только эвристики)"}.
      </p>

      {aiLoading ? (
        <p className="mt-3 text-xs text-slate">Подбор ссылок…</p>
      ) : mergedAi.length === 0 ? (
        <p className="mt-3 text-xs text-slate">Дополнительных подсказок пока нет.</p>
      ) : (
        <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-xs">
          {mergedAi.map((item) => (
            <li
              key={item.slug}
              className="rounded-lg border border-sky/15 bg-sky/5 px-3 py-2"
            >
              <p className="font-medium text-charcoal">
                <Link href={item.href} className="text-sky hover:underline" target="_blank">
                  {item.title}
                </Link>
              </p>
              <p className="mt-1 text-slate/90">
                {item.reason}
                {item.source === "ai" ? " · ИИ" : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
