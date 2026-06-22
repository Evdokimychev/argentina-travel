"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, BookOpen } from "lucide-react";
import { useSavedArticles } from "@/hooks/useSavedArticles";
import { cn } from "@/lib/cn";
import { cabinetCardClass, cabinetLinkClass } from "@/lib/cabinet-ui";
import { mediaUrl } from "@/lib/media-resolver";

type ProfileSavedArticlesPanelProps = {
  className?: string;
};

export default function ProfileSavedArticlesPanel({ className }: ProfileSavedArticlesPanelProps) {
  const { saved, toggle } = useSavedArticles();

  if (saved.length === 0) return null;

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-sky" aria-hidden />
        <h2 className="font-heading text-lg font-bold text-charcoal">Сохранённые статьи</h2>
        <span className="rounded-full bg-sky/10 px-2 py-0.5 text-xs font-semibold text-sky">
          {saved.length}
        </span>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {saved.map((article) => (
          <li key={article.slug}>
            <article className={cn(cabinetCardClass, "overflow-hidden")}>
              <div className="relative aspect-[3/2] bg-surface-muted">
                {article.image ? (
                  <Image
                    src={mediaUrl(article.image)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 400px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sky/40">
                    <BookOpen className="h-10 w-10" strokeWidth={1.25} aria-hidden />
                  </div>
                )}
              </div>
              <div className="p-4">
                {article.category ? (
                  <span className="text-xs font-medium uppercase tracking-wide text-sky">
                    {article.category}
                  </span>
                ) : null}
                <h3 className="line-clamp-2 font-heading text-base font-bold text-charcoal">
                  <Link href={`/blog/${article.slug}`} className="hover:text-sky">
                    {article.title}
                  </Link>
                </h3>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link href={`/blog/${article.slug}`} className={cn(cabinetLinkClass, "text-sm")}>
                    Читать статью
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      toggle({
                        slug: article.slug,
                        title: article.title,
                        category: article.category,
                        image: article.image,
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate transition-colors hover:text-sky"
                  >
                    <Bookmark className="h-3.5 w-3.5 fill-current text-sky" aria-hidden />
                    Убрать
                  </button>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
