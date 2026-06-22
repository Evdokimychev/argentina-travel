import type { PlaceDetail } from "@/types/place";
import type { TourListing } from "@/types";
import { getDestinationPageById } from "@/data/destination-pages";
import { matchToursForDestination } from "@/lib/destinations";
import { pairedDestinationIdForPlace } from "@/lib/geography-links";
import { filterArgentinaHomepageTours } from "@/lib/homepage-tours";

export function matchToursForPlace(tours: TourListing[], place: PlaceDetail): TourListing[] {
  const argentinaTours = filterArgentinaHomepageTours(tours);
  const destinationId = pairedDestinationIdForPlace(place.slug);
  if (destinationId) {
    const destination = getDestinationPageById(destinationId);
    if (destination) {
      const matched = matchToursForDestination(argentinaTours, destination);
      if (matched.length > 0) return matched.slice(0, 6);
    }
  }

  const haystackNeedle = place.name.toLowerCase();
  return argentinaTours
    .filter((tour) => {
      const haystack = [tour.title, tour.destination, tour.region, tour.shortDescription]
        .join(" ")
        .toLowerCase();
      return tour.region === place.region || haystack.includes(haystackNeedle.split(/\s+/)[0] ?? "");
    })
    .slice(0, 6);
}
