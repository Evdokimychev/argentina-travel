import { notFound } from "next/navigation";
import BlogPostView from "@/components/blog/BlogPostView";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { getBlogPostBySlug, blogPosts } from "@/data/blog";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return { title: "Статья не найдена" };
  return {
    title: post.seoTitle ?? post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const initialTours = await fetchMarketplaceTours();

  return (
    <>
      <ArticleJsonLd post={post} />
      <BlogPostView post={post} initialTours={initialTours} />
    </>
  );
}
