import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FlightRouteLandingView from "@/components/flights/FlightRouteLandingView";
import FlightOffersJsonLd from "@/components/seo/FlightOffersJsonLd";
import {
  FLIGHT_POPULAR_ROUTES,
  getFlightRouteById,
  getRelatedFlightRoutes,
} from "@/data/flight-popular-routes";
import { fetchRouteFlightPriceTeaser } from "@/lib/flights/hub-price-teasers";
import { getFlightRouteLabels } from "@/lib/flights/route-labels";
import { buildTravelpayoutsPriceWidgetUrl } from "@/lib/travelpayouts/price-widget-config";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

type PageProps = {
  params: Promise<{ route: string }>;
};

export async function generateStaticParams() {
  return FLIGHT_POPULAR_ROUTES.map((route) => ({ route: route.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { route: routeId } = await params;
  const route = getFlightRouteById(routeId);
  if (!route) return { title: "Маршрут" };

  const locale = "ru" as const;
  const labels = getFlightRouteLabels(locale);
  const title = labels.heroTitle
    .replace("{origin}", route.originLabel)
    .replace("{destination}", route.destinationLabel);
  const description = labels.getRouteIntro(route.id, route.originLabel, route.destinationLabel);

  return buildPublicPageMetadata({
    title: `${title} — авиабилеты`,
    description,
    path: `/flights/${route.id}`,
  });
}

export default async function FlightRoutePage({ params }: PageProps) {
  const { route: routeId } = await params;
  const route = getFlightRouteById(routeId);
  if (!route) notFound();

  const locale = "ru" as const;
  const teaser = await fetchRouteFlightPriceTeaser({
    routeId: route.id,
    origin: route.origin,
    destination: route.destination,
    originLabel: route.originLabel,
    destinationLabel: route.destinationLabel,
    locale,
  });

  const priceWidgetScriptUrl = buildTravelpayoutsPriceWidgetUrl({
    origin: route.origin,
    destination: route.destination,
    locale,
  });

  const relatedRoutes = getRelatedFlightRoutes(route.id);

  return (
    <>
      {teaser ? (
        <FlightOffersJsonLd teasers={[teaser]} pageUrl={`/flights/${route.id}`} />
      ) : null}
      <FlightRouteLandingView
        route={route}
        teaser={teaser}
        priceWidgetScriptUrl={priceWidgetScriptUrl}
        relatedRoutes={relatedRoutes}
        locale={locale}
      />
    </>
  );
}
