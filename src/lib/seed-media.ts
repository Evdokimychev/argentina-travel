import { getPlaceCoverImage, getTourCoverImage, getTourGallery } from "@/lib/media-resolver";

export { TRANSFER_VEHICLE_PLACEHOLDER } from "@/lib/media/media-placeholders";

export function tourCover(slug: string): string {
  return getTourCoverImage(slug);
}

export function tourGalleryImage(slug: string, index: number): string {
  const gallery = getTourGallery(slug);
  const cover = getTourCoverImage(slug);
  if (!gallery.length) return cover;
  return gallery[index % gallery.length] ?? cover;
}

export function placeCover(slug: string): string {
  return getPlaceCoverImage(slug);
}
