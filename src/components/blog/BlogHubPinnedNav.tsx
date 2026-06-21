import type { BlogPost } from "@/types";

type BlogHubPinnedNavProps = {
  posts: BlogPost[];
};

export default function BlogHubPinnedNav({ posts }: BlogHubPinnedNavProps) {
  if (posts.length === 0) return null;

  return (
    <nav
      className="mt-6 rounded-3xl border border-sky/15 bg-gradient-to-br from-sky/[0.04] to-white p-4 shadow-card sm:p-5"
      aria-labelledby="blog-hub-pinned-title"
    >
      <h2 id="blog-hub-pinned-title" className="text-sm font-semibold text-charcoal">
        Из этого раздела
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {posts.map((post) => (
          <li key={post.slug}>
            <a
              href={`#hub-post-${post.slug}`}
              className="blog-touch-target inline-flex max-w-full items-center rounded-full border border-gray-200 bg-white px-3 text-sm font-medium text-charcoal transition-colors hover:border-sky/30 hover:bg-sky/5 hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
            >
              <span className="truncate">{post.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
