import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionDetailView from "@/components/collections/CollectionDetailView";
import CollectionItemListJsonLd from "@/components/seo/CollectionItemListJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { fetchCollectionBySlugServer, fetchCollectionsServer } from "@/lib/places-repository";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const collections = await fetchCollectionsServer();
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await fetchCollectionBySlugServer(slug);
  if (!collection) return { title: "Подборка не найдена" };
  const coverImage =
    collection.coverImage ?? collection.places[0]?.coverImage ?? undefined;
  return buildPublicPageMetadata({
    title: `${collection.title} — подборки мест`,
    description: collection.description,
    path: `/collections/${slug}`,
    image: coverImage,
  });
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const collection = await fetchCollectionBySlugServer(slug);
  if (!collection) notFound();
  return (
    <>
      <CollectionItemListJsonLd collection={collection} />
      <CollectionDetailView collection={collection} />
    </>
  );
}
