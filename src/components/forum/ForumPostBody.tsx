"use client";

import { renderForumBodyHtml } from "@/lib/forum/forum-body";
import { cn } from "@/lib/cn";

export default function ForumPostBody({
  body,
  className,
}: {
  body: string;
  className?: string;
}) {
  const html = renderForumBodyHtml(body);

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-charcoal prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-blockquote:border-sky/30 prose-blockquote:text-slate prose-strong:text-charcoal",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
