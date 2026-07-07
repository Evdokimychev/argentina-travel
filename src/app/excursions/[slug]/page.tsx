import { notFound } from "next/navigation";
import ExcursionDetailView from "@/components/excursions/ExcursionDetailView";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import ExcursionJsonLd from "@/components/seo/ExcursionJsonLd";
import { buildDetailBreadcrumbItems } from "@/lib/detail-breadcrumbs";
import { capBuildStaticParams } from "@/lib/build-static-limits";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import {
  fetchExcursionDetailServer,
  fetchExcursionSlugsServer,
  fetchSimilarExcursionsServer,
} from "@/lib/tripster/excursion-server";

type ExcursionPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await fetchExcursionSlugsServer();
  return capBuildStaticParams(slugs).map((slug) => ({ slug }));
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
    6,
    excursion.partner
  );
  const locale = await getServerI18nLocale();

  return (
    <>
      <BreadcrumbListJsonLd
        items={buildDetailBreadcrumbItems(locale, "excursions", {
          name: excursion.title,
          path: `/excursions/${slug}`,
        })}
      />
      <ExcursionJsonLd excursion={excursion} />
      <ExcursionDetailView excursion={excursion} similarExcursions={similarExcursions} />
    </>
  );
}
