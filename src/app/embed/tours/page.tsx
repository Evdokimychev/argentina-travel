import type { Metadata } from "next";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { parseTourEmbedSearchParams } from "@/lib/tour-embed";
import EmbedToursPageClient from "./EmbedToursPageClient";

export const metadata: Metadata = {
  title: "Виджет туров",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmbedToursPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const config = parseTourEmbedSearchParams(params);
  const tours = await fetchMarketplaceTours();

  if (!config) {
    return (
      <div className="p-6 text-center text-sm text-slate">
        Не удалось загрузить виджет туров.
      </div>
    );
  }

  return <EmbedToursPageClient config={config} initialTours={tours} />;
}
