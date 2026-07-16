import "server-only";

import { unstable_cache } from "next/cache";
import { fetchCutoverPublishedTourSlugs } from "@/lib/tours-server-cutover";
import { fetchPartnerTourSlugsServer } from "@/lib/tripster/partner-tour-server";
import { fetchYouTravelTourSlugsServer } from "@/lib/youtravel/partner-tour-server";
import { fetchExcursionSlugsServer } from "@/lib/excursion-server";

export type PublicDetailKind = "tours" | "excursions";

const fetchPublicTourSlugs = unstable_cache(
  async () => {
    const [native, tripster, youtravel] = await Promise.all([
      fetchCutoverPublishedTourSlugs(),
      fetchPartnerTourSlugsServer().catch(() => [] as string[]),
      fetchYouTravelTourSlugsServer().catch(() => [] as string[]),
    ]);
    return [...new Set([...native, ...tripster, ...youtravel])];
  },
  ["public-tour-slugs-v2"],
  { revalidate: 600, tags: ["tours", "partner-tours", "youtravel-tours"] },
);

const fetchPublicExcursionSlugs = unstable_cache(
  fetchExcursionSlugsServer,
  ["public-excursion-slugs-v2"],
  { revalidate: 600, tags: ["excursions"] },
);

export async function publicDetailExists(
  kind: PublicDetailKind,
  slug: string,
): Promise<boolean> {
  const slugs =
    kind === "tours" ? await fetchPublicTourSlugs() : await fetchPublicExcursionSlugs();
  return slugs.includes(slug);
}
