import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentPageView from "@/components/content/ContentPageView";
import KakDobratsyaHubView from "@/components/guide/hub/KakDobratsyaHubView";
import GuidePillarView from "@/components/guide/GuidePillarView";
import GuideTopicView from "@/components/guide/GuideTopicView";
import { KAK_DOBRATSYA_HUB } from "@/data/guide-hub-kak-dobratsya";
import { listPublishedGuideSlugs, resolveGuidePage } from "@/lib/cms/guide-resolver";
import {
  getAllGuideTopics,
  getGuideTopicBySlug,
  getGuideTopicMetadata,
  isGuideTopicSlug,
} from "@/lib/guide-topics";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";

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

  const topicMeta = getGuideTopicMetadata(slug);
  if (topicMeta) {
    if (slug === "kak-dobratsya") {
      return {
        title: KAK_DOBRATSYA_HUB.heroTitle,
        description: KAK_DOBRATSYA_HUB.heroSubtitle,
      };
    }
    return {
      title: topicMeta.title,
      description: topicMeta.description,
    };
  }

  const page = await resolveGuidePage(slug);
  if (!page) return { title: "Путеводитель" };
  return {
    title: page.title,
    description: page.description,
  };
}

export default async function GuideSlugPage({ params }: PageProps) {
  const { slug } = await params;

  if (isGuideTopicSlug(slug)) {
    const topic = getGuideTopicBySlug(slug);
    if (!topic) notFound();
    if (slug === "kak-dobratsya") {
      return <KakDobratsyaHubView topic={topic} />;
    }
    if (topic.pillarPage) {
      const initialTours = await fetchMarketplaceTours();
      return <GuidePillarView topic={topic} initialTours={initialTours} />;
    }
    return <GuideTopicView topic={topic} />;
  }

  const page = await resolveGuidePage(slug);
  if (!page) notFound();
  return <ContentPageView page={page} />;
}
