"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import {
  BLOG_CATEGORY_META,
  BLOG_DEFAULT_CATEGORY_META,
} from "@/data/blog-category-meta";
import type { BlogCategoryWithCount } from "@/lib/blog-utils";
import { cn } from "@/lib/cn";

type BlogTopicHubsProps = {
  categories: BlogCategoryWithCount[];
  activeCategory: string;
  onCategorySelect: (category: string) => void;
  className?: string;
};

export default function BlogTopicHubs({
  categories,
  activeCategory,
  onCategorySelect,
  className,
}: BlogTopicHubsProps) {
  const hubs = categories.slice(0, 8);
  if (hubs.length === 0) return null;

  return (
    <section className={className} aria-labelledby="blog-topic-hubs-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="blog-topic-hubs-title" className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
            Темы и регионы
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate">
            Выберите направление — откроется каталог с фильтром по категории
          </p>
        </div>
        {activeCategory !== "Все" ? (
          <button
            type="button"
            onClick={() => onCategorySelect("Все")}
            className="text-sm font-medium text-sky hover:underline"
          >
            Показать все темы
          </button>
        ) : null}
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {hubs.map(({ category, count }) => {
          const meta = BLOG_CATEGORY_META[category] ?? BLOG_DEFAULT_CATEGORY_META;
          const active = activeCategory === category;

          return (
            <li key={category}>
              <button
                type="button"
                onClick={() => onCategorySelect(category)}
                className={cn(
                  "group relative flex h-full w-full overflow-hidden rounded-2xl border text-left transition-all",
                  active
                    ? "border-sky ring-2 ring-sky/20 shadow-md"
                    : "border-gray-100 bg-white shadow-card hover:-translate-y-0.5 hover:border-sky/25 hover:shadow-lg",
                )}
              >
                <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
                  <Image
                    src={meta.image}
                    alt={category}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="112px"
                  />
                  <div className="absolute inset-0 bg-charcoal/20" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-sky">
                    {count} {count === 1 ? "статья" : count < 5 ? "статьи" : "статей"}
                  </span>
                  <span className="mt-1 font-heading text-sm font-bold leading-snug text-charcoal group-hover:text-sky sm:text-base">
                    {category}
                  </span>
                  <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate">
                    {meta.description}
                  </span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sky opacity-0 transition-opacity group-hover:opacity-100">
                    Смотреть
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
