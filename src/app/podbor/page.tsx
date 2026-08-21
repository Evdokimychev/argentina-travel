import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { fetchMarketplaceToursSafely } from "@/data/marketplace-tours-server";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const PodborView = dynamic(() => import("@/components/podbor/PodborView"), {
  loading: () => (
    <div
      className="mx-auto min-h-[60vh] max-w-3xl animate-pulse rounded-3xl bg-surface-muted"
      aria-hidden
    />
  ),
});

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Подбор маршрута по Аргентине",
  description:
    "Интерактивный подбор путешествия по Аргентине: регионы, туры и экскурсии под ваши цели, бюджет и темп.",
  path: "/podbor",
});

export default async function PodborPage() {
  const { tours, catalogUnavailable } = await fetchMarketplaceToursSafely(
    "podbor_catalog_unavailable",
  );

  return (
    <div className="pb-8">
      <PodborView tours={tours} catalogUnavailable={catalogUnavailable} />
    </div>
  );
}
