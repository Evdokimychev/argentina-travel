import { DESTINATION_PAGES, getDestinationPageById } from "@/data/destination-pages";
import { destinationCatalogHref } from "@/lib/site-nav";
import type { DestinationPage } from "@/data/destination-pages";
import type { TourListing } from "@/types";

export { destinationCatalogHref };

export function getAllDestinations(): DestinationPage[] {
  return DESTINATION_PAGES;
}

export function getDestinationBySlug(slug: string): DestinationPage | undefined {
  return getDestinationPageById(slug);
}

export function destinationHref(id: string): string {
  return `/destinations/${id}`;
}

export function matchToursForDestination(
  tours: TourListing[],
  destination: DestinationPage
): TourListing[] {
  const terms = [destination.name, destination.region, ...destination.keywords].map((term) =>
    term.toLowerCase()
  );

  return tours.filter((tour) => {
    const haystack = [
      tour.title,
      tour.destination,
      tour.region,
      tour.shortDescription,
      tour.activityType,
    ]
      .join(" ")
      .toLowerCase();

    return terms.some((term) => haystack.includes(term));
  });
}

export function destinationCatalogLink(destination: DestinationPage): string {
  return destinationCatalogHref(destination.name);
}
