import { notFound } from "next/navigation";
import ExcursionDetailView from "@/components/excursions/ExcursionDetailView";
import ExcursionJsonLd from "@/components/seo/ExcursionJsonLd";
import {
  fetchExcursionDetailServer,
  fetchExcursionSlugsServer,
  fetchSimilarExcursionsServer,
} from "@/lib/tripster/excursion-server";

type ExcursionPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await fetchExcursionSlugsServer();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ExcursionPageProps) {
  const { slug } = await params;
  const excursion = await fetchExcursionDetailServer(slug);
  if (!excursion) return { title: "Экскурсия не найдена" };

  const description =
    excursion.annotation || excursion.tagline || `Экскурсия в ${excursion.cityName}`;

  return {
    title: `${excursion.title} — экскурсия в Аргентине`,
    description,
    openGraph: {
      title: excursion.title,
      description,
      images: excursion.coverImage ? [excursion.coverImage] : undefined,
      type: "website",
    },
    alternates: {
      canonical: `/excursions/${slug}`,
    },
  };
}

export default async function ExcursionDetailPage({ params }: ExcursionPageProps) {
  const { slug } = await params;
  const excursion = await fetchExcursionDetailServer(slug);
  if (!excursion) notFound();

  const similarExcursions = await fetchSimilarExcursionsServer(
    excursion.cityId,
    excursion.id,
    6
  );

  return (
    <>
      <ExcursionJsonLd excursion={excursion} />
      <ExcursionDetailView excursion={excursion} similarExcursions={similarExcursions} />
    </>
  );
}
