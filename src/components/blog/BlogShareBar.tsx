"use client";

import { useState } from "react";
import { Check, Link2, MessageCircle } from "lucide-react";
import BlogSaveArticleButton from "@/components/blog/BlogSaveArticleButton";
import { SITE_WHATSAPP_URL } from "@/data/site-contacts";
import { trackMessengerClick } from "@/lib/analytics/gtm-events";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

type BlogShareBarProps = {
  post: Pick<BlogPost, "slug" | "title" | "category" | "image">;
  className?: string;
};

export default function BlogShareBar({ post, className }: BlogShareBarProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* пользователь отменил или буфер недоступен */
    }
  }

  function handleWhatsAppShare() {
    const url = window.location.href;
    const text = `${post.title}\n${url}`;
    const href = `${SITE_WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
    trackMessengerClick({ channel: "whatsapp", href, label: "blog_share" });
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-surface-muted/50 p-3",
        className,
      )}
      aria-label="Поделиться статьёй"
    >
      <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate">Поделиться</span>
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-slate transition-colors hover:border-sky/30 hover:bg-sky/5 hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
            Ссылка скопирована
          </>
        ) : (
          <>
            <Link2 className="h-3.5 w-3.5" aria-hidden />
            Скопировать ссылку
          </>
        )}
      </button>
      <button
        type="button"
        onClick={handleWhatsAppShare}
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-slate transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
      >
        <MessageCircle className="h-3.5 w-3.5" aria-hidden />
        WhatsApp
      </button>
      <BlogSaveArticleButton post={post} showProfileLink={false} />
    </div>
  );
}
