import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ExcursionsCatalog from "@/components/excursions/ExcursionsCatalog";
import {
  fetchExcursionCityServer,
  fetchExcursionsServer,
} from "@/lib/tripster/excursion-server";

type CityPageProps = {
  params: Promise<{ citySlug: string }>;
};

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { citySlug } = await params;
  const city = await fetchExcursionCityServer(citySlug);
  if (!city) return { title: "Город не найден" };

  return {
    title: `Экскурсии в ${city.name}`,
    description: `Городские экскурсии и активности в ${city.name}, Аргентина.`,
    openGraph: {
      title: `Экскурсии в ${city.name}`,
      description: `Городские экскурсии и активности в ${city.name}, Аргентина.`,
      type: "website",
    },
    alternates: {
      canonical: `/excursions/city/${citySlug}`,
    },
  };
}

export default async function ExcursionCityPage({ params }: CityPageProps) {
  const { citySlug } = await params;
  const city = await fetchExcursionCityServer(citySlug);
  if (!city) notFound();

  const { items, cities } = await fetchExcursionsServer({
    citySlug,
    pageSize: 200,
  });

  return (
    <ExcursionsCatalog
      excursions={items}
      cities={cities}
      initialCitySlug={citySlug}
      title={`Экскурсии в ${city.name}`}
      subtitle={`${city.experienceCount} маршрутов и активностей в городе`}
    />
  );
}
