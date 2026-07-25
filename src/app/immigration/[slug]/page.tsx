import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentPageView from "@/components/content/ContentPageView";
import ImmigrationPillarView from "@/components/immigration/ImmigrationPillarView";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import {
  getAllImmigrationTopics,
  getImmigrationTopicBySlug,
  getImmigrationTopicMetadata,
} from "@/lib/immigration-topics";
import { getContentPage, getPagesBySection } from "@/lib/content-pages";
import { getImmigrationTopicHeroImage } from "@/lib/media-resolver";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Allow short immigration articles (content_pages) beyond static pillar topics. */
export const dynamicParams = true;

export async function generateStaticParams() {
  const topicSlugs = getAllImmigrationTopics().map((topic) => ({ slug: topic.slug }));
  const articleSlugs = getPagesBySection("immigration").map((page) => ({ slug: page.slug }));
  const seen = new Set<string>();
  return [...topicSlugs, ...articleSlugs].filter((entry) => {
    if (seen.has(entry.slug)) return false;
    seen.add(entry.slug);
    return true;
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topicMeta = getImmigrationTopicMetadata(slug);
  if (topicMeta) {
    const path = `/immigration/${slug}`;
    return {
      ...buildPublicPageMetadata({
        title: topicMeta.title,
        description: topicMeta.description,
        path,
        image: getImmigrationTopicHeroImage(slug),
      }),
      alternates: buildHreflangAlternates(path),
    };
  }

  const page = getContentPage("immigration", slug);
  if (!page) {
    return {
      title: "Материал не найден",
      robots: { index: false, follow: false },
    };
  }
  const path = `/immigration/${slug}`;
  return {
    ...buildPublicPageMetadata({
      title: page.title,
      description: page.description,
      path,
    }),
    alternates: buildHreflangAlternates(path),
  };
}

export default async function ImmigrationArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const topic = getImmigrationTopicBySlug(slug);
  if (topic) {
    return <ImmigrationPillarView topic={topic} />;
  }

  const page = getContentPage("immigration", slug);
  if (!page) notFound();
  return <ContentPageView page={page} />;
}
