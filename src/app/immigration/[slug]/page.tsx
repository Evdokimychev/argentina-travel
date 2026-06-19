import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentPageView from "@/components/content/ContentPageView";
import ImmigrationPillarView from "@/components/immigration/ImmigrationPillarView";
import { getContentPage, getPagesBySection } from "@/lib/content-pages";
import {
  getAllImmigrationTopics,
  getImmigrationTopicBySlug,
  getImmigrationTopicMetadata,
  isImmigrationTopicSlug,
} from "@/lib/immigration-topics";
import { getImmigrationFreshnessState } from "@/lib/content-freshness-server";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const topicSlugs = getAllImmigrationTopics().map((topic) => ({ slug: topic.slug }));
  const articleSlugs = getPagesBySection("immigration").map((page) => ({ slug: page.slug }));
  return [...topicSlugs, ...articleSlugs];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const topicMeta = getImmigrationTopicMetadata(slug);
  if (topicMeta) {
    return {
      title: topicMeta.title,
      description: topicMeta.description,
    };
  }

  const page = getContentPage("immigration", slug);
  if (!page) return { title: "Иммиграция" };
  return {
    title: page.title,
    description: page.description,
  };
}

export default async function ImmigrationArticlePage({ params }: PageProps) {
  const { slug } = await params;

  if (isImmigrationTopicSlug(slug)) {
    const topic = getImmigrationTopicBySlug(slug);
    if (!topic) notFound();
    return <ImmigrationPillarView topic={topic} />;
  }

  const page = getContentPage("immigration", slug);
  if (!page) notFound();
  const freshness = await getImmigrationFreshnessState(slug, page.updatedAt);
  return <ContentPageView page={page} freshness={freshness} />;
}
