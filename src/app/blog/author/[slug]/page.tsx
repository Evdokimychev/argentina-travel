import { notFound } from "next/navigation";
import BlogPostView from "@/components/blog/BlogPostView";
import TranslationPreparingBanner from "@/components/i18n/TranslationPreparingBanner";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BlogFaqJsonLd from "@/components/seo/BlogFaqJsonLd";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { getCmsResolverMetadata } from "@/lib/cms/content-resolver";
import { resolveAuthorArticle, listPublishedAuthorArticleSlugs } from "@/lib/cms/author-article-resolver";
import { buildCmsContentHreflangAlternates } from "@/lib/cms/cms-hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { getBlogPostHeroResolved } from "@/lib/media-resolver";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { absoluteUrl, resolvePublicUrl } from "@/lib/site-url";

interface AuthorArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await listPublishedAuthorArticleSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: AuthorArticlePageProps) {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const post = await resolveAuthorArticle(slug, locale);
  if (!post) return { title: "Статья не найдена" };

  const alternates = await buildCmsContentHreflangAlternates("author_article", slug);
  const pageMetadata = buildPublicPageMetadata({
    title: post.seoTitle ?? post.title,
    description: post.excerpt,
    path: `/blog/author/${slug}`,
    image: post.image,
  });

  return {
    ...pageMetadata,
    alternates: {
      ...alternates,
      ...pageMetadata.alternates,
      canonical: absoluteUrl(`/blog/author/${slug}`),
    },
  };
}

export default async function AuthorArticlePage({ params }: AuthorArticlePageProps) {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const post = await resolveAuthorArticle(slug, locale);

  if (!post) {
    notFound();
  }

  const cmsMetadata = getCmsResolverMetadata(post);
  const initialTours = await fetchMarketplaceTours();
  const heroSrc = resolvePublicUrl(getBlogPostHeroResolved(post).src);

  return (
    <>
      <link rel="preload" as="image" href={heroSrc} fetchPriority="high" />
      {cmsMetadata?.showTranslationBanner ? (
        <TranslationPreparingBanner locale={cmsMetadata.requestedLocale} />
      ) : null}
      <ArticleJsonLd post={post} />
      <BlogFaqJsonLd post={post} />
      <BlogPostView post={post} initialTours={initialTours} />
    </>
  );
}
