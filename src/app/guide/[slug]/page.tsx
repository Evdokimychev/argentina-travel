import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentPageView from "@/components/content/ContentPageView";
import GuidePillarView from "@/components/guide/GuidePillarView";
import GuideTopicView from "@/components/guide/GuideTopicView";
import { getContentPage, getPagesBySection } from "@/lib/content-pages";
import {
  getAllGuideTopics,
  getGuideTopicBySlug,
  getGuideTopicMetadata,
  isGuideTopicSlug,
} from "@/lib/guide-topics";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const articleSlugs = getPagesBySection("guide").map((page) => ({ slug: page.slug }));
  const topicSlugs = getAllGuideTopics().map((topic) => ({ slug: topic.slug }));
  return [...topicSlugs, ...articleSlugs];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const topicMeta = getGuideTopicMetadata(slug);
  if (topicMeta) {
    return {
      title: topicMeta.title,
      description: topicMeta.description,
    };
  }

  const page = getContentPage("guide", slug);
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
    if (topic.pillarPage) {
      return <GuidePillarView topic={topic} />;
    }
    return <GuideTopicView topic={topic} />;
  }

  const page = getContentPage("guide", slug);
  if (!page) notFound();
  return <ContentPageView page={page} />;
}
