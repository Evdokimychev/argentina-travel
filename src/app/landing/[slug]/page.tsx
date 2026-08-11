import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentPageView from "@/components/content/ContentPageView";
import TranslationPreparingBanner from "@/components/i18n/TranslationPreparingBanner";
import { buildCmsContentHreflangAlternates } from "@/lib/cms/cms-hreflang";
import { buildCmsPageMetadata } from "@/lib/cms/cms-page-metadata";
import { getCmsResolverMetadata } from "@/lib/cms/content-resolver";
import { withCmsPublicFallback } from "@/lib/cms/public-read-result";
import {
  listPublishedLandingSlugs,
  resolveLandingPage,
} from "@/lib/cms/landing-resolver";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// Landing documents are CMS-only and locale-aware. A temporary CMS outage must
// not make the whole application impossible to build; dynamic requests still
// resolve against the live CMS once it is available.
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const slugs = await withCmsPublicFallback(
    "landing:static-params",
    [],
    () => listPublishedLandingSlugs(),
  );
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const page = await resolveLandingPage(slug, locale);
  if (!page) {
    return {
      title: "Страница не найдена",
      robots: { index: false, follow: false },
    };
  }
  const alternates = await buildCmsContentHreflangAlternates("landing", slug, locale);
  return buildCmsPageMetadata({
    content: page,
    title: page.title,
    description: page.description,
    path: `/landing/${slug}`,
    alternates,
  });
}

export default async function LandingSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await resolveLandingPage(slug, await getServerI18nLocale());
  if (!page) notFound();
  const cmsMetadata = getCmsResolverMetadata(page);
  return (
    <>
      {cmsMetadata?.showTranslationBanner ? (
        <TranslationPreparingBanner locale={cmsMetadata.requestedLocale} />
      ) : null}
      <ContentPageView page={page} />
    </>
  );
}
