"use client";

import BlogArticleFeedback from "@/components/blog/BlogArticleFeedback";
import BlogShareBar from "@/components/blog/BlogShareBar";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

type BlogArticleEngagePanelProps = {
  post: Pick<BlogPost, "slug" | "title" | "category" | "image">;
  showShare?: boolean;
  showFeedback?: boolean;
  className?: string;
};

/**
 * Единый блок в конце статьи: оценка полезности + шаринг/сохранение.
 * Экономит место по сравнению с двумя отдельными карточками.
 */
export default function BlogArticleEngagePanel({
  post,
  showShare = true,
  showFeedback = true,
  className,
}: BlogArticleEngagePanelProps) {
  if (!showShare && !showFeedback) return null;

  return (
    <aside
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
      aria-label="Оценка и шаринг статьи"
    >
      {showFeedback ? (
        <BlogArticleFeedback slug={post.slug} title={post.title} embedded />
      ) : null}

      {showShare && showFeedback ? (
        <div className="my-3.5 border-t border-gray-100 sm:my-4" aria-hidden />
      ) : null}

      {showShare ? <BlogShareBar post={post} embedded /> : null}
    </aside>
  );
}
