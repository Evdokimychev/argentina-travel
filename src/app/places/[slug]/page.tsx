import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PlaceDetailView from "@/components/places/PlaceDetailView";
import FAQPageJsonLd from "@/components/seo/FAQPageJsonLd";
import PlaceJsonLd from "@/components/seo/PlaceJsonLd";
import { resolveKnowledgeLinksForPlace } from "@/lib/knowledge-internal-links";
import { fetchPlaceBySlugServer, fetchPlaceSlugsServer, placeHref } from "@/lib/places-repository";
import { buildPlaceMetadata } from "@/lib/places-seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await fetchPlaceSlugsServer();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const place = await fetchPlaceBySlugServer(slug);
  if (!place) return { title: "Место не найдено" };
  return buildPlaceMetadata(place);
}

export default async function PlaceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const place = await fetchPlaceBySlugServer(slug);
  if (!place) notFound();

  const knowledgeLinks = resolveKnowledgeLinksForPlace(slug);

  return (
    <>
      <PlaceJsonLd place={place} />
      {place.faq && place.faq.length > 0 ? (
        <FAQPageJsonLd questions={place.faq} path={placeHref(slug)} />
      ) : null}
      <PlaceDetailView place={place} knowledgeLinks={knowledgeLinks} />
    </>
  );
}
