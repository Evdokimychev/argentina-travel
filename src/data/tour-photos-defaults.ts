import { getPlaceGallery } from "@/lib/media-resolver";

export const ORGANIZER_TOUR_GALLERY_MIN = 6;
export const ORGANIZER_TOUR_GALLERY_MAX = 30;
export const ORGANIZER_TOUR_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export const DEFAULT_IGUAZU_GALLERY = getPlaceGallery("iguazu-falls");
