import TourDetailView from "@/components/tour-detail/TourDetailView";
import { fetchTourDetail, fetchSimilarTours } from "@/lib/tours";
import { baseTours } from "@/data/tours";

interface TourPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return baseTours.map((tour) => ({ slug: tour.slug }));
}

export async function generateMetadata({ params }: TourPageProps) {
  const { slug } = await params;
  const tour = await fetchTourDetail(slug);
  if (!tour) return { title: "Тур не найден" };
  return {
    title: tour.title,
    description: tour.shortDescription,
  };
}

export default async function TourDetailPage({ params }: TourPageProps) {
  const { slug } = await params;
  const tour = await fetchTourDetail(slug);
  const similarTours = tour ? await fetchSimilarTours(slug, 3) : [];

  return <TourDetailView slug={slug} tour={tour} similarTours={similarTours} />;
}
