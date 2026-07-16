import { notFound } from "next/navigation";
import ExcursionGuideProfileView from "@/components/excursions/ExcursionGuideProfileView";
import {
  fetchGuideIdsServer,
  fetchGuidePageServer,
} from "@/lib/tripster/guide-server";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

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

  const { profile, excursions } = page;
  const location = profile.cityName || excursions[0]?.cityName || "Аргентине";
  const role = profile.tagline || profile.roleLabel || `гид в ${location}`;
  const description = profile.description
    ? `Экскурсии с гидом ${profile.name} в ${location}. ${profile.description}`
    : `Экскурсии с гидом ${profile.name} в ${location} — ${SITE_BRAND_NAME}`;

  return buildPublicPageMetadata({
    title: `${profile.name} — ${role}`,
    description,
    path: `/excursions/guide/${guideId}`,
    image: profile.avatar,
  });
}

export default async function ExcursionGuidePage({ params }: GuidePageProps) {
  const { guideId } = await params;
  const id = Number.parseInt(guideId, 10);
  if (!Number.isFinite(id)) notFound();

  const page = await fetchGuidePageServer(id);
  if (!page) notFound();

  return <ExcursionGuideProfileView profile={page.profile} excursions={page.excursions} />;
}
