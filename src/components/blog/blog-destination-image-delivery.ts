const BLOG_DESTINATION_CARD_IDS = new Set([
  "ba",
  "bariloche",
  "calafate",
  "ushuaia",
  "iguazu",
  "mendoza",
  "patagonia",
]);

/** Lightweight, rights-tracked derivatives for the small cards rendered inside blog pages. */
export function blogDestinationCardImage(destinationId: string, fallback: string): string {
  if (!BLOG_DESTINATION_CARD_IDS.has(destinationId)) return fallback;
  return `/media/destinations/${destinationId}/section-card.webp`;
}
