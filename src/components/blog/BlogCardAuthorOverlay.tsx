"use client";

import { SafeImage } from "@/components/ui/safe-image";
import { BLOG_EDITORIAL } from "@/data/blog-author";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

type BlogCardAuthorOverlayProps = {
  post: BlogPost;
  /** Larger layout for featured cards */
  featured?: boolean;
};

export function BlogCardAuthorOverlay({ post, featured = false }: BlogCardAuthorOverlayProps) {
  const avatar = post.authorAvatar ?? BLOG_EDITORIAL.avatar;
  const bio = post.authorBio ?? BLOG_EDITORIAL.bio;
  const initial = post.author.trim().charAt(0).toUpperCase() || "Р";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5] flex flex-col justify-end overflow-hidden"
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-0 bg-charcoal/0 transition-colors duration-300",
          "group-hover:bg-charcoal/60 group-focus-within:bg-charcoal/60",
          "[@media(hover:none)]:bg-gradient-to-t [@media(hover:none)]:from-charcoal/70 [@media(hover:none)]:via-charcoal/25 [@media(hover:none)]:to-transparent",
          "motion-reduce:transition-none",
        )}
      />

      <div
        className={cn(
          "relative translate-y-3 opacity-0 transition-all duration-300 ease-out",
          "group-hover:translate-y-0 group-hover:opacity-100",
          "group-focus-within:translate-y-0 group-focus-within:opacity-100",
          "[@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100",
          "motion-reduce:transition-none",
        )}
      >
        <div className={cn("flex items-start gap-3 text-white", featured ? "p-5 sm:p-6" : "p-4")}>
          <div
            className={cn(
              "relative shrink-0 overflow-hidden rounded-full ring-2 ring-white/35 shadow-lg",
              featured ? "h-12 w-12 sm:h-14 sm:w-14" : "h-11 w-11",
            )}
          >
            {avatar ? (
              <SafeImage
                src={avatar}
                alt=""
                fill
                className="object-cover"
                sizes={featured ? "56px" : "44px"}
                placeholderVariant="avatar"
                placeholderCompact
                blurPlaceholder={false}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-sky/90 text-sm font-bold">
                {initial}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className={cn("font-semibold leading-tight", featured ? "text-base sm:text-lg" : "text-sm")}>
              {post.author}
            </p>
            <p
              className={cn(
                "mt-1 line-clamp-2 leading-snug text-white/88",
                featured ? "text-sm" : "text-xs",
              )}
            >
              {bio}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
