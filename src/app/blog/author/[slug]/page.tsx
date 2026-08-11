import { notFound } from "next/navigation";
import BlogPostView from "@/components/blog/BlogPostView";
import { fetchSiteBlog, fetchSiteForms } from "@/lib/site-settings-server";
import TranslationPreparingBanner from "@/components/i18n/TranslationPreparingBanner";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BlogFaqJsonLd from "@/components/seo/BlogFaqJsonLd";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { getCmsResolverMetadata } from "@/lib/cms/content-resolver";
import { resolveAuthorArticle, listPublishedAuthorArticleSlugs } from "@/lib/cms/author-article-resolver";
import { buildCmsContentHreflangAlternates } from "@/lib/cms/cms-hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { buildCmsPageMetadata } from "@/lib/cms/cms-page-metadata";
import { filterToursWithResolvedPublicDetail } from "@/lib/public-tour-resolver";
import {
  pickBlogPostTourCandidates,
  resolveOptionalBlogTourCatalog,
} from "@/lib/blog-optional-tour-catalog";

export const dynamic = "force-dynamic";

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

  const alternates = await buildCmsContentHreflangAlternates("author_article", slug, locale);
  return buildCmsPageMetadata({
    content: post,
    title: post.seoTitle ?? post.title,
    description: post.excerpt,
    path: `/blog/author/${slug}`,
    image: post.image,
    alternates,
  });
}

export default async function AuthorArticlePage({ params }: AuthorArticlePageProps) {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const post = await resolveAuthorArticle(slug, locale);

  if (!post) {
    notFound();
  }

  const cmsMetadata = getCmsResolverMetadata(post);
  const tourEmbeds = post.tourEmbeds ?? [];
  const initialTours = tourEmbeds.length === 0
    ? Promise.resolve([])
    : resolveOptionalBlogTourCatalog(fetchMarketplaceTours())
        .then((tours) => pickBlogPostTourCandidates(tours, tourEmbeds))
        .then(filterToursWithResolvedPublicDetail);
  const [blogSettings, forms] = await Promise.all([fetchSiteBlog(), fetchSiteForms()]);
  return (
    <>
      {cmsMetadata?.showTranslationBanner ? (
        <TranslationPreparingBanner locale={cmsMetadata.requestedLocale} />
      ) : null}
      <ArticleJsonLd post={post} />
      <BlogFaqJsonLd post={post} />
      <BlogPostView
        post={post}
        initialTours={initialTours}
        settings={blogSettings}
        newsletterEnabled={forms.newsletterEnabled}
      />
    </>
  );
}
