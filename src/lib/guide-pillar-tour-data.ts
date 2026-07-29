import type { GuidePillarContent } from "@/types/guide-pillar";
import type { TourListing } from "@/types";

type GuidePillarTourDataDependencies = {
  fetchMarketplaceTours: () => Promise<TourListing[]>;
  filterToursWithResolvedPublicDetail: (tours: TourListing[]) => Promise<TourListing[]>;
};

export type GuideTourEmbedState =
  | { status: "ok"; tours: TourListing[] }
  | { status: "unavailable" };

export function guidePillarNeedsMarketplaceTours(pillar: GuidePillarContent): boolean {
  const sectionSlots = pillar.sections.flatMap((section) =>
    section.widgetSlot ? [section.widgetSlot] : [],
  );
  const slots = [...sectionSlots, ...(pillar.widgetSlots ?? [])];

  return slots.some((slot) => slot.type === "tour-embed" && Boolean(slot.tourEmbed));
}

async function loadDefaultDependencies(): Promise<GuidePillarTourDataDependencies> {
  const [{ fetchMarketplaceTours }, { filterToursWithResolvedPublicDetail }] = await Promise.all([
    import("@/data/marketplace-tours-server"),
    import("@/lib/public-tour-resolver"),
  ]);

  return { fetchMarketplaceTours, filterToursWithResolvedPublicDetail };
}

export async function loadGuidePillarInitialTours(
  pillar: GuidePillarContent,
  dependencies?: GuidePillarTourDataDependencies,
): Promise<TourListing[]> {
  if (!guidePillarNeedsMarketplaceTours(pillar)) return [];

  const loaders = dependencies ?? (await loadDefaultDependencies());
  const marketplaceTours = await loaders.fetchMarketplaceTours();
  return loaders.filterToursWithResolvedPublicDetail(marketplaceTours);
}

export async function resolveGuideTourEmbedState(
  tours: TourListing[] | Promise<TourListing[]>,
): Promise<GuideTourEmbedState> {
  try {
    return { status: "ok", tours: await tours };
  } catch {
    return { status: "unavailable" };
  }
}
