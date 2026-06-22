"use client";

import { Bookmark } from "lucide-react";
import Link from "next/link";
import { useSavedArticles } from "@/hooks/useSavedArticles";
import { trackBlogArticleSave } from "@/lib/analytics/gtm-events";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

type BlogSaveArticleButtonProps = {
  post: Pick<BlogPost, "slug" | "title" | "category" | "image">;
  className?: string;
  showProfileLink?: boolean;
};

export default function BlogSaveArticleButton({
  post,
  className,
  showProfileLink = true,
}: BlogSaveArticleButtonProps) {
  const { isSaved, toggle } = useSavedArticles();
  const saved = isSaved(post.slug);

  return (
    <div className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={() => {
          const next = toggle(post);
          trackBlogArticleSave({
            slug: post.slug,
            title: post.title,
            action: next ? "add" : "remove",
          });
        }}
        aria-pressed={saved}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40",
          saved
            ? "border-sky/30 bg-sky/10 text-sky"
            : "border-gray-200 bg-white text-slate hover:border-sky/30 hover:bg-sky/5 hover:text-sky",
        )}
      >
        <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} aria-hidden />
        {saved ? "В сохранённых" : "Сохранить статью"}
      </button>
      {saved && showProfileLink ? (
        <Link href="/profile/favorites" className="text-xs font-medium text-sky hover:underline">
          Открыть избранное
        </Link>
      ) : null}
    </div>
  );
}
