import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OrganizerPublicView from "@/components/organizer-public/OrganizerPublicView";
import { fetchMarketplaceToursSafely } from "@/data/marketplace-tours-server";
import { buildPublicOrganizerProfile } from "@/lib/organizer-public";
import { resolveListingOwnerUserId } from "@/lib/organizer-public-routing";
import { PUBLIC_ORGANIZERS } from "@/data/public-organizers";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

interface OrganizerPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return PUBLIC_ORGANIZERS.map((user) => ({
    slug: user.id,
  }));
}

export async function generateMetadata({ params }: OrganizerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = buildPublicOrganizerProfile(slug);
  if (!profile) return { title: "Организатор не найден" };
  return buildPublicPageMetadata({
    title: `${profile.name} — организатор туров`,
    description: profile.shortDescription || `Авторские туры по Аргентине от ${profile.name}`,
    path: `/organizers/${slug}`,
  });
}

export default async function OrganizerPublicPage({ params }: OrganizerPageProps) {
  const { slug } = await params;
  const profile = buildPublicOrganizerProfile(slug);
  if (!profile) notFound();

  const allTours = (await fetchMarketplaceToursSafely("organizer_public_catalog_unavailable"))
    .tours;
  const tours = allTours.filter(
    (listing) => listing && resolveListingOwnerUserId(listing) === slug,
  );

  return <OrganizerPublicView profile={profile} initialTours={tours} />;
}
