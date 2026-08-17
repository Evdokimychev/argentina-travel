import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContentPageView from "@/components/content/ContentPageView";
import KakDobratsyaHubView from "@/components/guide/hub/KakDobratsyaHubView";
import GuidePillarView from "@/components/guide/GuidePillarView";
import GuideTopicView from "@/components/guide/GuideTopicView";
import TranslationPreparingBanner from "@/components/i18n/TranslationPreparingBanner";
import {
  listPublishedGuideSlugs,
  resolveGuidePage,
  resolveGuideTopic,
} from "@/lib/cms/guide-resolver";
import { getCmsResolverMetadata } from "@/lib/cms/content-resolver";
import { buildGuideSlugPageMetadata } from "@/lib/cms/guide-slug-metadata";
import { isCmsPublicContentUnavailableError } from "@/lib/cms/public-read-result";
import {
  getAllGuideTopics,
  isGuideTopicSlug,
} from "@/lib/guide-topics";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { loadGuidePillarInitialTours } from "@/lib/guide-pillar-tour-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const articleSlugs = (await listPublishedGuideSlugs()).map((slug) => ({ slug }));
  const topicSlugs = getAllGuideTopics().map((topic) => ({ slug: topic.slug }));
  return [...topicSlugs, ...articleSlugs];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  return buildGuideSlugPageMetadata(slug, locale);
}

function GuideCmsUnavailableView() {
  return (
    <main className="mx-auto w-full max-w-screen-md px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-medium text-sky-ink">Путеводитель</p>
      <h1 className="mt-2 font-heading text-3xl font-bold text-foreground">
        Материал временно недоступен
      </h1>
      <p className="mt-3 text-base leading-relaxed text-slate">
        Сейчас не удалось загрузить страницу из CMS. Это не значит, что тема удалена —
        обновите страницу чуть позже или вернитесь к списку тем.
      </p>
      <Link
        href="/guide"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-button bg-sky-ink px-5 text-sm font-semibold text-white hover:bg-sky-ink/90"
      >
        Все темы путеводителя
      </Link>
    </main>
  );
}

export default async function GuideSlugPage({ params }: PageProps) {
  const { slug } = await params;

  if (isGuideTopicSlug(slug)) {
    const locale = await getServerI18nLocale();
    const topic = await resolveGuideTopic(slug, locale);
    if (!topic) notFound();
    if (slug === "kak-dobratsya") {
      if (topic.cmsPage && topic.pillarPage) {
        const initialTours = await loadGuidePillarInitialTours(topic.pillarPage);
        return <GuidePillarView topic={topic} initialTours={initialTours} />;
      }
      return <KakDobratsyaHubView topic={topic} />;
    }
    if (topic.pillarPage) {
      const initialTours = await loadGuidePillarInitialTours(topic.pillarPage);
      return <GuidePillarView topic={topic} initialTours={initialTours} />;
    }
    return <GuideTopicView topic={topic} />;
  }

  try {
    const page = await resolveGuidePage(slug, await getServerI18nLocale());
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
  } catch (error) {
    if (isCmsPublicContentUnavailableError(error)) {
      return <GuideCmsUnavailableView />;
    }
    throw error;
  }
}
