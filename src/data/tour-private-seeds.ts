/** Production provider: private demo access is unavailable outside demo builds. */
export const TOUR_PRIVATE_SEEDS: Record<
  string,
  { isPrivate: true; privateAccessToken: string }
> = {};

export function getPrivateTourSeedForSlug(slug: string) {
  return TOUR_PRIVATE_SEEDS[slug];
}
