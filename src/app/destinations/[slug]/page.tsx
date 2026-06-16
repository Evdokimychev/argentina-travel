import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DestinationDetailView from "@/components/destinations/DestinationDetailView";
import DestinationFlightSidebar from "@/components/flights/DestinationFlightSidebar";
import FlightOffersJsonLd from "@/components/seo/FlightOffersJsonLd";
import { getAllDestinations, getDestinationBySlug } from "@/lib/destinations";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { getDestinationFlightTeasers } from "@/lib/flights/hub-price-teasers";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllDestinations().map((destination) => ({ slug: destination.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = getDestinationBySlug(slug);
  if (!destination) return { title: "Направление" };

  return {
    title: `${destination.name} — направления Аргентины`,
    description: destination.intro,
  };
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const destination = getDestinationBySlug(slug);
  if (!destination) notFound();

  const tours = await fetchMarketplaceTours();
  const locale = "ru" as const;
  const flightTeasers = await getDestinationFlightTeasers(destination.id, locale);

  return (
    <>
      {flightTeasers.length > 0 ? (
        <FlightOffersJsonLd teasers={flightTeasers} pageUrl={`/destinations/${slug}`} />
      ) : null}
      <DestinationDetailView
        destination={destination}
        initialTours={tours}
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
