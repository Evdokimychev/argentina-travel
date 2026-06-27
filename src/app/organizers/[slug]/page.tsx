import { notFound } from "next/navigation";
import OrganizerPublicView from "@/components/organizer-public/OrganizerPublicView";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import {
  buildPublicOrganizerProfile,
  resolveListingOwnerUserId,
} from "@/lib/organizer-public";
import { SEED_USERS } from "@/lib/auth-store";

interface OrganizerPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return SEED_USERS.filter((user) => user.roles?.includes("organizer")).map((user) => ({
    slug: user.id,
  }));
}

export async function generateMetadata({ params }: OrganizerPageProps) {
  const { slug } = await params;
  const profile = buildPublicOrganizerProfile(slug);
  if (!profile) return { title: "Организатор не найден" };
  return {
    title: `${profile.name} — организатор туров`,
    description: profile.shortDescription || `Авторские туры по Аргентине от ${profile.name}`,
  };
}

export default async function OrganizerPublicPage({ params }: OrganizerPageProps) {
  const { slug } = await params;
  const profile = buildPublicOrganizerProfile(slug);
  if (!profile) notFound();

  const allTours = await fetchMarketplaceTours();
  const tours = allTours.filter(
    (listing) => listing && resolveListingOwnerUserId(listing) === slug,
  );

  return <OrganizerPublicView profile={profile} initialTours={tours} />;
}
