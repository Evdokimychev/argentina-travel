import Image from "next/image";
import Link from "next/link";
import { Clock, Eye } from "lucide-react";
import type { BlogPost, BlogCardVariant } from "@/types";
import { formatDate, formatBlogViews } from "@/data/blog";
import { cn } from "@/lib/cn";

type BlogCardProps = {
  post: BlogPost;
  variant?: BlogCardVariant;
};

function MetaRow({ post, className }: { post: BlogPost; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate", className)}>
      <span>{formatDate(post.date)}</span>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" aria-hidden />
        {post.readTime}
      </span>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <Eye className="h-3 w-3" aria-hidden />
        {formatBlogViews(post.views)}
      </span>
    </div>
  );
}

function TagList({ tags, limit = 3 }: { tags: string[]; limit?: number }) {
  const visible = tags.slice(0, limit);
  return (
    <ul className="flex flex-wrap gap-1.5">
      {visible.map((tag) => (
        <li
          key={tag}
          className="rounded-full border border-gray-200/80 bg-white/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}

export default function BlogCard({ post, variant = post.cardVariant ?? "standard" }: BlogCardProps) {
  if (variant === "featured") {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group col-span-full grid overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-card transition-shadow hover:shadow-lg md:grid-cols-[1.15fr_1fr]"
      >
        <div className="relative min-h-[220px] md:min-h-[320px]">
          <Image
            src={post.image}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 60vw"
            priority
          />
          <span className="absolute left-4 top-4 rounded-full border border-sky/20 bg-sky/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {post.category}
          </span>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-8">
          <MetaRow post={post} />
          <h2 className="mt-3 font-heading text-2xl font-bold leading-snug text-charcoal transition-colors group-hover:text-sky sm:text-3xl">
            {post.title}
          </h2>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate sm:text-base">{post.excerpt}</p>
          <div className="mt-4">
            <TagList tags={post.tags} limit={4} />
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group flex gap-3 rounded-2xl border border-transparent p-2 transition-colors hover:border-gray-100 hover:bg-white"
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
          <Image src={post.image} alt="" fill className="object-cover" sizes="64px" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-charcoal group-hover:text-sky">
            {post.title}
          </p>
          <p className="mt-1 text-[11px] text-slate">
            {post.readTime} · {formatBlogViews(post.views)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-card transition-shadow hover:shadow-lg"
    >
      <div className="relative h-48 overflow-hidden sm:h-52">
        <Image
          src={post.image}
          alt=""
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span className="absolute left-4 top-4 rounded-full border border-white/30 bg-white/90 px-3 py-1 text-xs font-semibold text-charcoal backdrop-blur-sm">
          {post.category}
        </span>
        {post.editorialReviewed ? (
          <span className="absolute right-4 top-4 rounded-full bg-emerald-600/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            Вычитано
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <MetaRow post={post} />
        <h3 className="mt-2 font-heading text-lg font-bold leading-snug text-charcoal transition-colors group-hover:text-sky">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate">{post.excerpt}</p>
        <div className="mt-4">
          <TagList tags={post.tags} />
        </div>
      </div>
    </Link>
  );
}
