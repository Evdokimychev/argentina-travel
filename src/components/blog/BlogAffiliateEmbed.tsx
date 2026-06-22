"use client";

import { useEffect, useRef, useState } from "react";
import { resolveBlogAffiliateEmbedForPost } from "@/lib/blog-affiliate-embeds";
import { trackBlogAffiliateEmbedView } from "@/lib/analytics/gtm-events";
import { cn } from "@/lib/cn";

type BlogAffiliateEmbedProps = {
  category: string;
  tags: string[];
  postSlug: string;
  className?: string;
};

export default function BlogAffiliateEmbed({
  category,
  tags,
  postSlug,
  className,
}: BlogAffiliateEmbedProps) {
  const config = resolveBlogAffiliateEmbedForPost({ category, tags });
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!config?.embedUrl || !containerRef.current) return;

    const node = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
        }
      },
      { rootMargin: "120px", threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [config?.embedUrl]);

  useEffect(() => {
    if (!visible || !config || trackedRef.current) return;
    trackedRef.current = true;
    trackBlogAffiliateEmbedView({
      slug: postSlug,
      service: config.service,
    });
  }, [visible, config, postSlug]);

  if (!config?.embedUrl) return null;

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden rounded-xl border border-gray-100 bg-white", className)}
    >
      <p className="border-b border-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate">
        {config.title}
      </p>
      {visible ? (
        <iframe
          src={config.embedUrl}
          title={config.title}
          loading="lazy"
          className="w-full border-0"
          style={{ minHeight: config.minHeight }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      ) : (
        <div
          className="flex items-center justify-center bg-surface-muted/40 text-xs text-slate"
          style={{ minHeight: config.minHeight }}
        >
          Загрузка виджета…
        </div>
      )}
    </div>
  );
}
