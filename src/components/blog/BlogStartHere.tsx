import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import BlogCard from "@/components/blog/BlogCard";
import type { BlogPost } from "@/types";

type BlogStartHereProps = {
  posts: BlogPost[];
  className?: string;
};

export default function BlogStartHere({ posts, className }: BlogStartHereProps) {
  if (posts.length === 0) return null;

  const [lead, ...rest] = posts;

  return (
    <section className={className} aria-labelledby="blog-start-here-title">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky/15 bg-sky/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Редакция
        </span>
        <h2 id="blog-start-here-title" className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
          С чего начать
        </h2>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">
        Подборка материалов, с которых удобно начать: сезоны, деньги, въезд, районы Буэнос-Айреса, Патагония и Мендоса.
        Остальной каталог собран по темам, регионам и практическим задачам.
      </p>

      <div className="mt-5 space-y-4">
        {lead ? <BlogCard post={lead} variant="featured" priority={false} /> : null}
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <li key={post.id}>
              <BlogCard post={post} variant="standard" />
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 flex items-center gap-2 text-sm text-slate">
        <BookOpen className="h-4 w-4 shrink-0 text-sky/70" aria-hidden />
        Нужна структура по разделам? Откройте{" "}
        <Link href="/guide" className="font-medium text-sky hover:underline">
          путеводитель
        </Link>{" "}
        или{" "}
        <Link href="/places" className="font-medium text-sky hover:underline">
          справочник мест
        </Link>
        .
      </p>
    </section>
  );
}
