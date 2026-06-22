import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getBlogPostHeroResolved } from "@/lib/media-resolver";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

type BlogPostNavProps = {
  prev: BlogPost | null;
  next: BlogPost | null;
  className?: string;
};

function PostThumbnail({ post }: { post: BlogPost }) {
  const hero = getBlogPostHeroResolved(post);

  return (
    <div className="relative h-full min-h-[7.5rem] w-28 shrink-0 overflow-hidden sm:w-36">
      <Image
        src={hero.src}
        alt={hero.alt}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="144px"
      />
      <div
        className="absolute inset-0 bg-charcoal/20 transition-colors group-hover:bg-charcoal/10"
        aria-hidden
      />
    </div>
  );
}

function PostNavCard({ post, direction }: { post: BlogPost; direction: "prev" | "next" }) {
  const isPrev = direction === "prev";

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:border-sky/30 hover:shadow-md",
        !isPrev && "sm:col-start-2"
      )}
    >
      {isPrev ? <PostThumbnail post={post} /> : null}

      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 p-4",
          isPrev ? "text-left" : "justify-end text-right"
        )}
      >
        {isPrev ? (
          <ArrowLeft
            className="hidden h-5 w-5 shrink-0 text-slate transition-colors group-hover:text-sky sm:block"
            aria-hidden
          />
        ) : null}

        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate">
            {isPrev ? "Предыдущая статья" : "Следующая статья"}
          </span>
          <span className="mt-0.5 block font-heading text-base font-bold leading-snug text-charcoal group-hover:text-sky sm:text-lg">
            {post.title}
          </span>
          <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate sm:text-sm">
            {post.excerpt}
          </span>
        </span>

        {!isPrev ? (
          <ArrowRight
            className="hidden h-5 w-5 shrink-0 text-slate transition-colors group-hover:text-sky sm:block"
            aria-hidden
          />
        ) : null}
      </div>

      {!isPrev ? <PostThumbnail post={post} /> : null}
    </Link>
  );
}

export default function BlogPostNav({ prev, next, className }: BlogPostNavProps) {
  if (!prev && !next) return null;

  return (
    <nav className={cn("grid gap-3 sm:grid-cols-2", className)} aria-label="Соседние статьи">
      {prev ? <PostNavCard post={prev} direction="prev" /> : <div aria-hidden />}
      {next ? <PostNavCard post={next} direction="next" /> : null}
    </nav>
  );
}
