/** OG / Twitter cover: первый кадр галереи или основной cover. */
export function resolveTourCoverImage(tour: {
  image?: string;
  gallery?: string[];
}): string | undefined {
  const fromGallery = tour.gallery?.find((src) => src?.trim());
  if (fromGallery) return fromGallery;
  return tour.image?.trim() || undefined;
}
