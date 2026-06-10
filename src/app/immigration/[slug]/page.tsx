import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentPageView from "@/components/content/ContentPageView";
import { getContentPage, getPagesBySection } from "@/lib/content-pages";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getPagesBySection("immigration").map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getContentPage("immigration", slug);
  if (!page) return { title: "Иммиграция" };
  return {
    title: page.title,
    description: page.description,
  };
}

export default async function ImmigrationArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const page = getContentPage("immigration", slug);
  if (!page) notFound();
  return <ContentPageView page={page} />;
}
