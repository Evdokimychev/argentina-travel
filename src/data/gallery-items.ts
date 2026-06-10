import { marketplaceTours } from "@/data/marketplace-tours";

export type GalleryItem = {
  id: string;
  title: string;
  region: string;
  regionSlug: string;
  destination: string;
  tourSlug: string;
  imageUrl: string;
};

const REGION_SLUG_MAP: Record<string, string> = {
  Патагония: "patagonia",
  "Буэнос-Айрес": "buenos-aires",
  Misiones: "misiones",
  Мендоса: "mendoza",
  Сальта: "salta",
  "Огненная Земля": "tierra-del-fuego",
};

function toRegionSlug(region: string): string {
  return REGION_SLUG_MAP[region] ?? region.toLowerCase().replace(/\s+/g, "-");
}

export function buildGalleryItems(): GalleryItem[] {
  const items: GalleryItem[] = [];

  for (const tour of marketplaceTours) {
    const gallery = tour.gallery?.length ? tour.gallery : [tour.image];
    gallery.forEach((imageUrl, index) => {
      items.push({
        id: `${tour.slug}-${index}`,
        title: tour.title,
        region: tour.region,
        regionSlug: toRegionSlug(tour.region),
        destination: tour.destination,
        tourSlug: tour.slug,
        imageUrl,
      });
    });
  }

  return items;
}

export const galleryItems = buildGalleryItems();

export const GALLERY_REGIONS = Array.from(
  new Map(
    galleryItems.map((item) => [item.regionSlug, { slug: item.regionSlug, label: item.region }])
  ).values()
).sort((a, b) => a.label.localeCompare(b.label, "ru"));
