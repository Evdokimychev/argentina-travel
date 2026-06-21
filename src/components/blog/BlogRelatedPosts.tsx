import BlogCard from "@/components/blog/BlogCard";
import type { BlogPost } from "@/types";

type BlogRelatedPostsProps = {
  posts: BlogPost[];
  className?: string;
};

export default function BlogRelatedPosts({ posts, className }: BlogRelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className={className} aria-labelledby="blog-related-posts-title">
      <h2 id="blog-related-posts-title" className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
        Читайте также
      </h2>
      <ul className="mt-5 grid gap-5 sm:grid-cols-2">
        {posts.map((post) => (
          <li key={post.id}>
            <BlogCard post={post} variant="standard" />
          </li>
        ))}
      </ul>
    </section>
  );
}
