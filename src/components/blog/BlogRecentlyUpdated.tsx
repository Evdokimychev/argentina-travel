import BlogCard from "@/components/blog/BlogCard";
import { sortBlogPostsByUpdated } from "@/lib/blog-utils";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

type BlogRecentlyUpdatedProps = {
  posts: BlogPost[];
  limit?: number;
  className?: string;
};

export default function BlogRecentlyUpdated({
  posts,
  limit = 4,
  className,
}: BlogRecentlyUpdatedProps) {
  const updated = sortBlogPostsByUpdated(posts).slice(0, limit);
  if (updated.length === 0) return null;

  return (
    <section className={cn(className)} aria-labelledby="blog-recently-updated-title">
      <h2
        id="blog-recently-updated-title"
        className="font-heading text-xl font-bold text-charcoal sm:text-2xl"
      >
        Недавно обновлённые
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-slate">
        Материалы с актуальными правками — удобно начать с проверенных обновлений
      </p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {updated.map((post) => (
          <li key={post.id}>
            <BlogCard post={post} variant="standard" />
          </li>
        ))}
      </ul>
    </section>
  );
}
