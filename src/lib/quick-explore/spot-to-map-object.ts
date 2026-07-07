import type { MapObject } from "@/lib/map-types";
import type { QuickExploreSpot } from "@/lib/quick-explore/types";

export function spotToMapObject(spot: QuickExploreSpot): MapObject {
  return {
    id: spot.id,
    slug: spot.slug,
    kind: spot.kind,
    title: spot.title,
    description: spot.summary,
    image: spot.image?.url,
    latitude: spot.latitude,
    longitude: spot.longitude,
    region: spot.region,
    href: spot.hrefPlace ?? spot.hrefKb ?? "#",
  };
}

export function spotsToMapObjects(spots: QuickExploreSpot[]): MapObject[] {
  return spots.map(spotToMapObject);
}
