"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Hero from "@/components/Hero";
import BlogCard from "@/components/BlogCard";
import { blogPosts } from "@/data/blog";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

const CATEGORIES = ["Все", ...Array.from(new Set(blogPosts.map((post) => post.category)))];

export default function BlogIndexView() {
  const [activeCategory, setActiveCategory] = useState("Все");

  const filteredPosts = useMemo(() => {
    if (activeCategory === "Все") return blogPosts;
    return blogPosts.filter((post) => post.category === activeCategory);
  }, [activeCategory]);

  return (
    <>
      <Hero
        title="Блог о путешествиях"
        subtitle="Полезные советы, гастрономические гиды и культурные заметки об Аргентине"
        image="https://images.unsplash.com/photo-1516026672322-bc52c61a55d5?w=1920&q=80"
        compact
      />

      <section className={siteContainerClass + " py-12"}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  activeCategory === category
                    ? "bg-sky text-white"
                    : "bg-gray-100 text-slate hover:bg-sky/10 hover:text-sky"
                )}
              >
                {category}
              </button>
            ))}
          </div>
          <Link href="/guide" className="text-sm font-medium text-sky hover:underline">
            Путеводитель →
          </Link>
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {filteredPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </>
  );
}
