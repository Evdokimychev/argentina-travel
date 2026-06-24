import { dedupeGalleryImages } from "@/lib/gallery-images";
import { resolveYouTravelMediaUrl } from "@/lib/youtravel/partner-tour-content";
import { mapYouTravelComfortToComfortLevel } from "@/lib/youtravel/partner-levels";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import type { TourAccommodation, TourAccommodationRoomType } from "@/types";
import type { YouTravelTour } from "@/lib/youtravel/types";

function resolveComfortLevel(
  content: PartnerTourContent,
  payload: YouTravelTour,
): TourAccommodation["comfort"] {
  if (content.comfortLevel != null) {
    return mapYouTravelComfortToComfortLevel(content.comfortLevel);
  }

  const payloadLevel =
    payload.comfort_data && typeof payload.comfort_data === "object"
      ? Number((payload.comfort_data as { level?: number }).level)
      : undefined;
  return mapYouTravelComfortToComfortLevel(payloadLevel);
}

function resolveAccommodationPhotos(
  content: PartnerTourContent,
  payload: YouTravelTour,
): string[] {
  const photos: string[] = [...(content.accommodationPhotos ?? [])];

  const sources = Array.isArray(payload.photo_allocation) ? payload.photo_allocation : [];
  for (const item of sources) {
    const url = resolveYouTravelMediaUrl(item);
    if (url) photos.push(url);
  }

  for (const url of payload.public_page_extras?.accommodationPhotos ?? []) {
    if (url?.trim()) photos.push(url.trim());
  }

  return dedupeGalleryImages(photos);
}

function mapRoomTypes(
  content: PartnerTourContent,
  payload: YouTravelTour,
): TourAccommodationRoomType[] {
  if (content.accommodationRoomTypes?.length) {
    return content.accommodationRoomTypes.map((room) => ({
      id: room.id,
      name: room.name,
      description: "",
      capacity: 2,
      priceUsdPerPerson: 0,
      images: [],
    }));
  }

  const raw = payload.type_accommodation;
  if (!Array.isArray(raw)) return [];

  const roomTypes: TourAccommodationRoomType[] = [];

  for (const [index, item] of raw.entries()) {
    if (typeof item === "string") {
      const name = item.trim();
      if (!name) continue;
      roomTypes.push({
        id: `yt-room-${index + 1}`,
        name,
        description: "",
        capacity: 2,
        priceUsdPerPerson: 0,
        images: [],
      });
      continue;
    }

    if (!item || typeof item !== "object") continue;
    const record = item as { id?: string | number; name?: string };
    const name = record.name?.trim();
    if (!name) continue;

    roomTypes.push({
      id: record.id != null ? String(record.id) : `yt-room-${index + 1}`,
      name,
      description: "",
      capacity: 2,
      priceUsdPerPerson: 0,
      images: [],
    });
  }

  return roomTypes;
}

export function hasYouTravelAccommodationContent(content: PartnerTourContent): boolean {
  return Boolean(
    content.accommodationTypesSummary?.trim() ||
      content.accommodationPhotos?.length ||
      content.accommodationRoomTypes?.length ||
      content.comfortLevel != null ||
      content.comfortDescription?.trim(),
  );
}

function resolveAccommodationName(content: PartnerTourContent, payload: YouTravelTour): string {
  const summary = content.accommodationTypesSummary?.trim();
  if (summary) return summary;

  const allocation = payload.type_allocation;
  if (typeof allocation === "string" && allocation.trim()) return allocation.trim();
  return "Проживание по программе тура";
}

export function mapYouTravelAccommodations(
  content: PartnerTourContent,
  payload: YouTravelTour,
): TourAccommodation[] {
  const name = resolveAccommodationName(content, payload);
  const images = resolveAccommodationPhotos(content, payload);
  const roomTypes = mapRoomTypes(content, payload);
  const hasData =
    Boolean(name.trim()) ||
    images.length > 0 ||
    roomTypes.length > 0 ||
    Boolean(content.comfortLevel) ||
    Boolean(content.comfortDescription?.trim());

  if (!hasData) return [];

  return [
    {
      id: "yt-accommodation-main",
      name,
      description: "",
      comfort: resolveComfortLevel(content, payload),
      amenities: [],
      images,
      fullPeriod: true,
      roomTypes: roomTypes.length ? roomTypes : undefined,
    },
  ];
}
