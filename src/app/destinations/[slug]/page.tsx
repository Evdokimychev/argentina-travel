import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DestinationDetailView from "@/components/destinations/DestinationDetailView";
import DestinationFlightSidebar from "@/components/flights/DestinationFlightSidebar";
import FlightOffersJsonLd from "@/components/seo/FlightOffersJsonLd";
import TouristDestinationJsonLd from "@/components/seo/TouristDestinationJsonLd";
import {
  listPublishedDestinationSlugs,
  resolveDestinationPage,
} from "@/lib/cms/destination-resolver";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { getDestinationFlightTeasers } from "@/lib/flights/hub-price-teasers";
import { resolveKnowledgeLinksForDestination } from "@/lib/knowledge-internal-links";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await listPublishedDestinationSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = await resolveDestinationPage(slug);
  if (!destination) return { title: "Направление" };

  return {
    title: `${destination.name} — направления Аргентины`,
    description: destination.intro,
  };
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const destination = await resolveDestinationPage(slug);
  if (!destination) notFound();

  const tours = await fetchMarketplaceTours();
  const locale = "ru" as const;
  const flightTeasers = await getDestinationFlightTeasers(destination.id, locale);
  const knowledgeLinks = resolveKnowledgeLinksForDestination(destination.id);

  return (
    <>
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
