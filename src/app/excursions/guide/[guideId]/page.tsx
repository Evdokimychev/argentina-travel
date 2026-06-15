import { notFound } from "next/navigation";
import ExcursionGuideProfileView from "@/components/excursions/ExcursionGuideProfileView";
import {
  fetchGuideIdsServer,
  fetchGuidePageServer,
} from "@/lib/tripster/guide-server";

type GuidePageProps = {
  params: Promise<{ guideId: string }>;
};

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const guideIds = await fetchGuideIdsServer();
  return guideIds.map((guideId) => ({ guideId: String(guideId) }));
}

export async function generateMetadata({ params }: GuidePageProps) {
  const { guideId } = await params;
  const id = Number.parseInt(guideId, 10);
  if (!Number.isFinite(id)) return { title: "Гид не найден" };

  const page = await fetchGuidePageServer(id);
  if (!page) return { title: "Гид не найден" };

  const { profile } = page;
  const description =
    profile.description?.slice(0, 160) ||
    `Экскурсии с гидом ${profile.name} в Аргентине на GoArgentina.ru`;

  return {
    title: `${profile.name} — гид по экскурсиям в Аргентине`,
    description,
    openGraph: {
      title: `${profile.name} — гид`,
      description,
      images: profile.avatar ? [profile.avatar] : undefined,
      type: "profile",
    },
    alternates: {
      canonical: `/excursions/guide/${guideId}`,
    },
  };
}

export default async function ExcursionGuidePage({ params }: GuidePageProps) {
  const { guideId } = await params;
  const id = Number.parseInt(guideId, 10);
  if (!Number.isFinite(id)) notFound();

  const page = await fetchGuidePageServer(id);
  if (!page) notFound();

  return <ExcursionGuideProfileView profile={page.profile} excursions={page.excursions} />;
}
