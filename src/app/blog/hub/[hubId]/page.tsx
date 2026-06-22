import { notFound } from "next/navigation";
import BlogHubView from "@/components/blog/BlogHubView";
import { getAllBlogHubIds, getBlogHubById, blogHubPath } from "@/data/blog-hubs";
import { resolveBlogCatalog } from "@/lib/cms/blog-resolver";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

interface BlogHubPageProps {
  params: Promise<{ hubId: string }>;
}

export function generateStaticParams() {
  return getAllBlogHubIds().map((hubId) => ({ hubId }));
}

export async function generateMetadata({ params }: BlogHubPageProps) {
  const { hubId } = await params;
  const hub = getBlogHubById(hubId);
  if (!hub) return { title: "Подборка не найдена" };

  return {
    ...buildPublicPageMetadata({
      title: `${hub.title} — блог «Пора в Аргентину»`,
      description: hub.seoDescription,
      path: blogHubPath(hubId),
      image: hub.image,
    }),
    alternates: buildHreflangAlternates(blogHubPath(hubId)),
  };
}

export default async function BlogHubPage({ params }: BlogHubPageProps) {
  const { hubId } = await params;
  const hub = getBlogHubById(hubId);
  if (!hub) notFound();

  const locale = await getServerI18nLocale();
  const [posts, initialTours] = await Promise.all([
    resolveBlogCatalog(locale),
    fetchMarketplaceTours(),
  ]);

  return <BlogHubView hub={hub} posts={posts} initialTours={initialTours} />;
}
