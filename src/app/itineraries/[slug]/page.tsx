import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ItineraryDetailView from "@/components/itineraries/ItineraryDetailView";
import ItineraryTripJsonLd from "@/components/seo/ItineraryTripJsonLd";
import { fetchItinerariesServer, fetchItineraryBySlugServer } from "@/lib/places-repository";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const itineraries = await fetchItinerariesServer();
  return itineraries.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const itinerary = await fetchItineraryBySlugServer(slug);
  if (!itinerary) return { title: "Маршрут не найден" };
  return {
    title: `${itinerary.title} — маршрут`,
    description: itinerary.description,
    alternates: { canonical: `/itineraries/${slug}` },
  };
}

export default async function ItineraryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const itinerary = await fetchItineraryBySlugServer(slug);
  if (!itinerary) notFound();
  return (
    <>
      <ItineraryTripJsonLd itinerary={itinerary} />
      <ItineraryDetailView itinerary={itinerary} />
    </>
  );
}
