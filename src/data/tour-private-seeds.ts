/** Демо-приватные туры: slug → токен доступа для ?access= */
export const TOUR_PRIVATE_SEEDS: Record<
  string,
  { isPrivate: true; privateAccessToken: string }
> = {
  "fitz-roy-trek": {
    isPrivate: true,
    privateAccessToken: "demo-fitz-roy-vip",
  },
  "ushuaia-end-of-world": {
    isPrivate: true,
    privateAccessToken: "demo-ushuaia-private",
  },
};

export function getPrivateTourSeedForSlug(slug: string) {
  return TOUR_PRIVATE_SEEDS[slug];
}
