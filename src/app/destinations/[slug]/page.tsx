import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DestinationDetailView from "@/components/destinations/DestinationDetailView";
import { getAllDestinations, getDestinationBySlug } from "@/lib/destinations";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";

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

  return <DestinationDetailView destination={destination} initialTours={tours} />;
}
