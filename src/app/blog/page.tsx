import Hero from "@/components/Hero";
import BlogCard from "@/components/BlogCard";
import { blogPosts } from "@/data/blog";

export const metadata = {
  title: "Блог",
  description: "Советы, истории и вдохновение для путешествий по Аргентине",
};

export default function BlogPage() {
  return (
    <>
      <Hero
        title="Блог о путешествиях"
        subtitle="Полезные советы, гастрономические гиды и культурные заметки об Аргентине"
        image="https://images.unsplash.com/photo-1516026672322-bc52c61a55d5?w=1920&q=80"
        compact
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
          {blogPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </>
  );
}
