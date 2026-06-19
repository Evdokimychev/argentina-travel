import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PlaceDetailView from "@/components/places/PlaceDetailView";
import FAQPageJsonLd from "@/components/seo/FAQPageJsonLd";
import PlaceJsonLd from "@/components/seo/PlaceJsonLd";
import { resolveKnowledgeLinksForPlace } from "@/lib/knowledge-internal-links";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { placeHref } from "@/lib/places-repository";
import { listPublishedPlaceSlugs, resolvePlacePage } from "@/lib/cms/place-resolver";
import { buildCmsContentHreflangAlternates } from "@/lib/cms/cms-hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { buildPlaceMetadata } from "@/lib/places-seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await listPublishedPlaceSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const place = await resolvePlacePage(slug, locale);
  if (!place) return { title: "Место не найдено" };
  const alternates = await buildCmsContentHreflangAlternates("place", slug);
  return { ...buildPlaceMetadata(place), alternates };
}

export default async function PlaceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const place = await resolvePlacePage(slug, locale);
  if (!place) notFound();

  const knowledgeLinks = resolveKnowledgeLinksForPlace(slug);
  const initialTours = await fetchMarketplaceTours();

  return (
    <>
      <PlaceJsonLd place={place} />
      {place.faq && place.faq.length > 0 ? (
        <FAQPageJsonLd questions={place.faq} path={placeHref(slug)} />
      ) : null}
      <PlaceDetailView place={place} knowledgeLinks={knowledgeLinks} initialTours={initialTours} />
    </>
  );
}
