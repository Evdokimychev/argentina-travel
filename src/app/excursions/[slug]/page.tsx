import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import ExcursionDetailView from "@/components/excursions/ExcursionDetailView";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import ExcursionJsonLd from "@/components/seo/ExcursionJsonLd";
import TourJsonLd from "@/components/seo/TourJsonLd";
import TourDetailView from "@/components/tour-detail/TourDetailView";
import { buildDetailBreadcrumbItems } from "@/lib/detail-breadcrumbs";
import { capBuildStaticParams } from "@/lib/build-static-limits";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import {
  fetchExcursionDetailServer,
  fetchExcursionSlugsServer,
  fetchSimilarExcursionsServer,
} from "@/lib/tripster/excursion-server";
import { fetchPublishedExcursionBySlugServer } from "@/lib/tour-content-server";
import { fetchPlacesServer } from "@/lib/places-repository";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { getTourPrivateAccessFromCookies } from "@/lib/tour-private-access";

type ExcursionPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ access?: string }>;
};

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await fetchExcursionSlugsServer();
  return capBuildStaticParams(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }: ExcursionPageProps) {
  const { slug } = await params;
  const { access: queryAccess } = await searchParams;
  const cookieStore = await cookies();
  const access = queryAccess ?? getTourPrivateAccessFromCookies(cookieStore, slug);
  const native = await fetchPublishedExcursionBySlugServer(slug, { accessToken: access });
  if (native) {
    const metadata = buildPublicPageMetadata({
      title: `${native.detail.title} — экскурсия в Аргентине`,
      description: `Экскурсия «${native.detail.title}»: ${native.detail.shortDescription}`,
      path: `/excursions/${slug}`,
      image: native.detail.image,
    });
    return {
      ...metadata,
      robots: native.canonical.isPrivate ? { index: false, follow: false } : undefined,
      alternates: native.canonical.isPrivate ? undefined : metadata.alternates,
    };
  }
  const excursion = await fetchExcursionDetailServer(slug);
  if (!excursion) notFound();

  const description =
    excursion.annotation || excursion.tagline || `Экскурсия в ${excursion.cityName}`;

  return buildPublicPageMetadata({
    title: `${excursion.title} — экскурсия в Аргентине`,
    description: `Экскурсия «${excursion.title}»: ${description}`,
    path: `/excursions/${slug}`,
    image: excursion.coverImage,
  });
}

export default async function ExcursionDetailPage({ params, searchParams }: ExcursionPageProps) {
  const { slug } = await params;
  const { access: queryAccess } = await searchParams;
  const cookieStore = await cookies();
  const access = queryAccess ?? getTourPrivateAccessFromCookies(cookieStore, slug);
  const native = await fetchPublishedExcursionBySlugServer(slug, { accessToken: access });
  if (native) {
    const [locale, catalogPlaces] = await Promise.all([
      getServerI18nLocale(),
      fetchPlacesServer(),
    ]);
    return (
      <>
        {!native.canonical.isPrivate ? (
          <>
            <BreadcrumbListJsonLd
              items={buildDetailBreadcrumbItems(locale, "excursions", {
                name: native.detail.title,
                path: `/excursions/${slug}`,
              })}
            />
            <TourJsonLd tour={native.detail} catalogPath="/excursions" />
          </>
        ) : null}
        <TourDetailView
          slug={slug}
          tour={native.detail}
          similarTours={[]}
          initialCanonicalTour={native.canonical}
          catalogPlaces={catalogPlaces}
          catalogKind="excursion"
        />
      </>
    );
  }
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
