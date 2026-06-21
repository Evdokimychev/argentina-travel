import type { PlaceListing } from "@/types/place";
import type { CmsDocument } from "@/types/cms-content";

/** CMS place listing without TS/Prisma fallback (cutover mode). */
export function placeListingFromCmsDocument(
  doc: CmsDocument,
  fallback?: PlaceListing
): PlaceListing | null {
  if (doc.body.kind !== "place") return null;
  const shortDescription = doc.body.shortDescription || fallback?.shortDescription || "";

  return {
    id: fallback?.id ?? `cms-place-${doc.slug}`,
    slug: doc.slug,
    name: doc.title,
    shortDescription,
    category: fallback?.category ?? "city",
    region: fallback?.region ?? "Аргентина",
    province: fallback?.province,
    city: fallback?.city,
    latitude: fallback?.latitude ?? -34.6037,
    longitude: fallback?.longitude ?? -58.3816,
    coverImage: fallback?.coverImage,
    tags: fallback?.tags ?? [],
    rating: fallback?.rating,
    visitDuration: fallback?.visitDuration,
    season: fallback?.season,
    ticketPrice: fallback?.ticketPrice,
    popularity: fallback?.popularity ?? 50,
  };
}
