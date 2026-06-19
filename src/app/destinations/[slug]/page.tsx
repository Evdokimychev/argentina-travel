import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DestinationDetailView from "@/components/destinations/DestinationDetailView";
import DestinationFlightSidebar from "@/components/flights/DestinationFlightSidebar";
import TranslationPreparingBanner from "@/components/i18n/TranslationPreparingBanner";
import FlightOffersJsonLd from "@/components/seo/FlightOffersJsonLd";
import TouristDestinationJsonLd from "@/components/seo/TouristDestinationJsonLd";
import {
  listPublishedDestinationSlugs,
  resolveDestinationPage,
} from "@/lib/cms/destination-resolver";
import { buildCmsContentHreflangAlternates } from "@/lib/cms/cms-hreflang";
import { getCmsResolverMetadata } from "@/lib/cms/content-resolver";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { getDestinationFlightTeasers } from "@/lib/flights/hub-price-teasers";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { resolveKnowledgeLinksForDestination } from "@/lib/knowledge-internal-links";
import { absoluteUrl, resolvePublicUrl } from "@/lib/site-url";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await listPublishedDestinationSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const destination = await resolveDestinationPage(slug, locale);
  if (!destination) return { title: "Направление" };

  const alternates = await buildCmsContentHreflangAlternates("destination", slug);
  const title = `${destination.name} — направления Аргентины`;
  const description = destination.description ?? destination.intro;
  const pageUrl = absoluteUrl(`/destinations/${slug}`);
  const ogImage = resolvePublicUrl(destination.image);

  return {
    title,
    description,
    alternates: { ...alternates, canonical: pageUrl },
    openGraph: {
      title,
      description,
      type: "website",
      url: pageUrl,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const destination = await resolveDestinationPage(slug, locale);
  if (!destination) notFound();
  const cmsMetadata = getCmsResolverMetadata(destination);

  const tours = await fetchMarketplaceTours();
  const flightTeasers = await getDestinationFlightTeasers(destination.id, locale);
  const knowledgeLinks = resolveKnowledgeLinksForDestination(destination.id);

  return (
    <>
      {cmsMetadata?.showTranslationBanner ? (
        <TranslationPreparingBanner locale={cmsMetadata.requestedLocale} />
      ) : null}
      <TouristDestinationJsonLd destination={destination} />
      {flightTeasers.length > 0 ? (
        <FlightOffersJsonLd teasers={flightTeasers} pageUrl={`/destinations/${slug}`} />
      ) : null}
      <DestinationDetailView
        destination={destination}
        initialTours={tours}
        knowledgeLinks={knowledgeLinks}
        flightSidebar={
          <DestinationFlightSidebar
            destinationId={destination.id}
            destinationName={destination.name}
            locale={locale}
          />
        }
      />
    </>
  );
}
