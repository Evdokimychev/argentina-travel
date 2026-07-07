import type { MapMarkerKind } from "@/lib/map-types";

export type QuickExploreSpotKind = Extract<MapMarkerKind, "city" | "national_park" | "attraction">;

export type QuickExploreImage = {
  url: string;
  alt?: string;
  /** Подпись под фото: автор, лицензия, источник */
  credit?: string;
  sourceUrl?: string;
};

export type QuickExploreProvince = {
  iso: string;
  slug: string;
  nameRu: string;
  macroRegionRu: string;
  center: [number, number];
  zoom: number;
  spotCount: number;
};

export type QuickExploreSpot = {
  id: string;
  slug: string;
  provinceIso: string;
  kind: QuickExploreSpotKind;
  title: string;
  summary: string;
  latitude: number;
  longitude: number;
  region: string;
  image?: QuickExploreImage;
  hrefPlace?: string;
  hrefKb?: string;
  kbId?: string;
};

export type QuickExplorePayload = {
  provinces: QuickExploreProvince[];
  spots: QuickExploreSpot[];
};
