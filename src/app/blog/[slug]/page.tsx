import { notFound } from "next/navigation";
import BlogPostView from "@/components/blog/BlogPostView";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { blogPosts } from "@/data/blog";
import { resolveBlogCatalog, resolveBlogPost } from "@/lib/cms/blog-resolver";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const catalog = await resolveBlogCatalog();
    return catalog.map((post) => ({ slug: post.slug }));
  } catch {
    return blogPosts.map((post) => ({ slug: post.slug }));
  }
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await resolveBlogPost(slug);
  if (!post) return { title: "Статья не найдена" };
  return buildPublicPageMetadata({
    title: post.seoTitle ?? post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    image: post.image,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await resolveBlogPost(slug);

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
