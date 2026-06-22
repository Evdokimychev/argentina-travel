import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { blogHubPath, getPrimaryBlogHubForPost } from "@/data/blog-hubs";
import { getBlogTopicClusterSiblings } from "@/lib/blog-topic-cluster";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

type BlogTopicClusterNavProps = {
  post: BlogPost;
  catalog: BlogPost[];
  className?: string;
};

export default function BlogTopicClusterNav({
  post,
  catalog,
  className,
}: BlogTopicClusterNavProps) {
  const hub = getPrimaryBlogHubForPost(post);
  const siblings = getBlogTopicClusterSiblings(post, catalog, 6);
  if (!hub || siblings.length === 0) return null;

  return (
    <nav
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
      aria-label={`Материалы раздела «${hub.shortTitle}»`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sky">Тематический кластер</p>
          <p className="mt-1 font-heading text-base font-bold text-charcoal sm:text-lg">{hub.shortTitle}</p>
        </div>
        <Link
          href={blogHubPath(hub.id)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-sky hover:underline"
        >
          Все материалы
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <ul className="mt-3 space-y-1.5">
        {siblings.map((item) => (
          <li key={item.slug}>
            <Link
              href={item.href}
              className="blog-touch-target block rounded-lg px-2 py-1.5 text-sm text-slate transition-colors hover:bg-sky/5 hover:text-sky"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
