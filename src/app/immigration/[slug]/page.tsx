import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ImmigrationPillarView from "@/components/immigration/ImmigrationPillarView";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import {
  getAllImmigrationTopics,
  getImmigrationTopicBySlug,
  getImmigrationTopicMetadata,
} from "@/lib/immigration-topics";
import { getImmigrationTopicHeroImage } from "@/lib/media-resolver";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllImmigrationTopics().map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const metadata = getImmigrationTopicMetadata(slug);
  if (!metadata) {
    return {
      title: "Материал не найден",
      robots: { index: false, follow: false },
    };
  }
  const path = `/immigration/${slug}`;
  return {
    ...buildPublicPageMetadata({
      title: metadata.title,
      description: metadata.description,
      path,
      image: getImmigrationTopicHeroImage(slug),
    }),
    alternates: buildHreflangAlternates(path),
  };
}

export default async function ImmigrationArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const topic = getImmigrationTopicBySlug(slug);
  if (!topic) notFound();
  return <ImmigrationPillarView topic={topic} />;
}
